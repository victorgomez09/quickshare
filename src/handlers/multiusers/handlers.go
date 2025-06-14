package multiusers

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ihexxa/gocfg"
	qradix "github.com/ihexxa/q-radix/v3"
	"golang.org/x/crypto/bcrypt"

	"github.com/ihexxa/quickshare/src/db"
	"github.com/ihexxa/quickshare/src/depidx"
	q "github.com/ihexxa/quickshare/src/handlers"
)

var (
	ErrInvalidUser   = errors.New("invalid user name or password")
	ErrInvalidConfig = errors.New("invalid user config")
)

type MultiUsersSvc struct {
	cfg        gocfg.ICfg
	deps       *depidx.Deps
	apiACRules map[string]bool
	routeRules *qradix.RTree
}

func NewMultiUsersSvc(cfg gocfg.ICfg, deps *depidx.Deps) (*MultiUsersSvc, error) {
	publicPath := filepath.Join("/", cfg.GrabString("Fs.PublicPath"))

	apiACRules := map[string]bool{
		// TODO: make these configurable
		// admin rules
		apiRuleCname(db.AdminRole, "GET", "/"):                              true,
		apiRuleCname(db.AdminRole, "GET", publicPath):                       true,
		apiRuleCname(db.AdminRole, "POST", "/v1/users/login"):               true,
		apiRuleCname(db.AdminRole, "POST", "/v1/users/logout"):              true,
		apiRuleCname(db.AdminRole, "GET", "/v1/users/isauthed"):             true,
		apiRuleCname(db.AdminRole, "PATCH", "/v1/users/pwd"):                true,
		apiRuleCname(db.AdminRole, "PATCH", "/v1/users/"):                   true,
		apiRuleCname(db.AdminRole, "PATCH", "/v1/users/pwd/force-set"):      true,
		apiRuleCname(db.AdminRole, "POST", "/v1/users/"):                    true,
		apiRuleCname(db.AdminRole, "DELETE", "/v1/users/"):                  true,
		apiRuleCname(db.AdminRole, "GET", "/v1/users/list"):                 true,
		apiRuleCname(db.AdminRole, "GET", "/v1/users/self"):                 true,
		apiRuleCname(db.AdminRole, "PATCH", "/v1/users/preferences"):        true,
		apiRuleCname(db.AdminRole, "PUT", "/v1/fs/used-space"):              true,
		apiRuleCname(db.AdminRole, "POST", "/v1/roles/"):                    true,
		apiRuleCname(db.AdminRole, "DELETE", "/v1/roles/"):                  true,
		apiRuleCname(db.AdminRole, "GET", "/v1/roles/list"):                 true,
		apiRuleCname(db.AdminRole, "POST", "/v1/fs/files"):                  true,
		apiRuleCname(db.AdminRole, "DELETE", "/v1/fs/files"):                true,
		apiRuleCname(db.AdminRole, "GET", "/v1/fs/files"):                   true,
		apiRuleCname(db.AdminRole, "PATCH", "/v1/fs/files/chunks"):          true,
		apiRuleCname(db.AdminRole, "GET", "/v1/fs/files/chunks"):            true,
		apiRuleCname(db.AdminRole, "PATCH", "/v1/fs/files/copy"):            true,
		apiRuleCname(db.AdminRole, "PATCH", "/v1/fs/files/move"):            true,
		apiRuleCname(db.AdminRole, "GET", "/v1/fs/search"):                  true,
		apiRuleCname(db.AdminRole, "PUT", "/v1/fs/reindex"):                 true,
		apiRuleCname(db.AdminRole, "GET", "/v1/fs/dirs"):                    true,
		apiRuleCname(db.AdminRole, "GET", "/v1/fs/dirs/home"):               true,
		apiRuleCname(db.AdminRole, "POST", "/v1/fs/dirs"):                   true,
		apiRuleCname(db.AdminRole, "GET", "/v1/fs/uploadings"):              true,
		apiRuleCname(db.AdminRole, "DELETE", "/v1/fs/uploadings"):           true,
		apiRuleCname(db.AdminRole, "GET", "/v1/fs/metadata"):                true,
		apiRuleCname(db.AdminRole, "OPTIONS", "/v1/settings/health"):        true,
		apiRuleCname(db.AdminRole, "GET", "/v1/settings/client"):            true,
		apiRuleCname(db.AdminRole, "PATCH", "/v1/settings/client"):          true,
		apiRuleCname(db.AdminRole, "POST", "/v1/settings/errors"):           true,
		apiRuleCname(db.AdminRole, "GET", "/v1/settings/workers/queue-len"): true,

		apiRuleCname(db.AdminRole, "GET", "/v1/captchas/"):         true,
		apiRuleCname(db.AdminRole, "GET", "/v1/captchas/imgs"):     true,
		apiRuleCname(db.AdminRole, "POST", "/v1/fs/sharings"):      true,
		apiRuleCname(db.AdminRole, "DELETE", "/v1/fs/sharings"):    true,
		apiRuleCname(db.AdminRole, "GET", "/v1/fs/sharings"):       true,
		apiRuleCname(db.AdminRole, "GET", "/v1/fs/sharings/exist"): true,
		apiRuleCname(db.AdminRole, "GET", "/v1/fs/sharings/dirs"):  true,
		apiRuleCname(db.AdminRole, "GET", "/v1/fs/sharings/ids"):   true,
		apiRuleCname(db.AdminRole, "POST", "/v1/fs/hashes/sha1"):   true,

		// user rules
		apiRuleCname(db.UserRole, "GET", "/"):                       true,
		apiRuleCname(db.UserRole, "GET", publicPath):                true,
		apiRuleCname(db.UserRole, "POST", "/v1/users/logout"):       true,
		apiRuleCname(db.UserRole, "GET", "/v1/users/isauthed"):      true,
		apiRuleCname(db.UserRole, "PATCH", "/v1/users/pwd"):         true,
		apiRuleCname(db.UserRole, "GET", "/v1/users/self"):          true,
		apiRuleCname(db.UserRole, "PATCH", "/v1/users/preferences"): true,
		apiRuleCname(db.UserRole, "POST", "/v1/fs/files"):           true,
		apiRuleCname(db.UserRole, "DELETE", "/v1/fs/files"):         true,
		apiRuleCname(db.UserRole, "GET", "/v1/fs/files"):            true,
		apiRuleCname(db.UserRole, "PATCH", "/v1/fs/files/chunks"):   true,
		apiRuleCname(db.UserRole, "GET", "/v1/fs/files/chunks"):     true,
		apiRuleCname(db.UserRole, "PATCH", "/v1/fs/files/copy"):     true,
		apiRuleCname(db.UserRole, "PATCH", "/v1/fs/files/move"):     true,
		apiRuleCname(db.UserRole, "GET", "/v1/fs/search"):           true,
		apiRuleCname(db.UserRole, "GET", "/v1/fs/dirs"):             true,
		apiRuleCname(db.UserRole, "GET", "/v1/fs/dirs/home"):        true,
		apiRuleCname(db.UserRole, "POST", "/v1/fs/dirs"):            true,
		apiRuleCname(db.UserRole, "GET", "/v1/fs/uploadings"):       true,
		apiRuleCname(db.UserRole, "DELETE", "/v1/fs/uploadings"):    true,
		apiRuleCname(db.UserRole, "GET", "/v1/fs/metadata"):         true,
		apiRuleCname(db.UserRole, "OPTIONS", "/v1/settings/health"): true,
		apiRuleCname(db.UserRole, "GET", "/v1/settings/client"):     true,
		apiRuleCname(db.UserRole, "POST", "/v1/settings/errors"):    true,
		apiRuleCname(db.UserRole, "GET", "/v1/captchas/"):           true,
		apiRuleCname(db.UserRole, "GET", "/v1/captchas/imgs"):       true,
		apiRuleCname(db.UserRole, "POST", "/v1/fs/sharings"):        true,
		apiRuleCname(db.UserRole, "DELETE", "/v1/fs/sharings"):      true,
		apiRuleCname(db.UserRole, "GET", "/v1/fs/sharings"):         true,
		apiRuleCname(db.UserRole, "GET", "/v1/fs/sharings/exist"):   true,
		apiRuleCname(db.UserRole, "GET", "/v1/fs/sharings/dirs"):    true,
		apiRuleCname(db.UserRole, "GET", "/v1/fs/sharings/ids"):     true,
		apiRuleCname(db.UserRole, "POST", "/v1/fs/hashes/sha1"):     true,
		// visitor rules
		apiRuleCname(db.VisitorRole, "GET", "/"):                       true,
		apiRuleCname(db.VisitorRole, "GET", publicPath):                true,
		apiRuleCname(db.VisitorRole, "POST", "/v1/users/login"):        true,
		apiRuleCname(db.VisitorRole, "GET", "/v1/users/self"):          true,
		apiRuleCname(db.VisitorRole, "GET", "/v1/fs/files"):            true,
		apiRuleCname(db.VisitorRole, "GET", "/v1/fs/dirs"):             true,
		apiRuleCname(db.VisitorRole, "OPTIONS", "/v1/settings/health"): true,
		apiRuleCname(db.VisitorRole, "GET", "/v1/settings/client"):     true,
		apiRuleCname(db.VisitorRole, "GET", "/v1/captchas/"):           true,
		apiRuleCname(db.VisitorRole, "GET", "/v1/captchas/imgs"):       true,
		apiRuleCname(db.VisitorRole, "GET", "/v1/fs/sharings/exist"):   true,
		apiRuleCname(db.VisitorRole, "GET", "/v1/fs/sharings/dirs"):    true,
	}

	prefixRules := map[string]map[string]bool{
		"/v2/": {
			fmt.Sprintf("%s:GET", db.AdminRole):     true,
			fmt.Sprintf("%s:POST", db.AdminRole):    true,
			fmt.Sprintf("%s:PATCH", db.AdminRole):   true,
			fmt.Sprintf("%s:PUT", db.AdminRole):     true,
			fmt.Sprintf("%s:DELETE", db.AdminRole):  true,
			fmt.Sprintf("%s:OPTIONS", db.AdminRole): true,
		},
		"/v2/my/": {
			fmt.Sprintf("%s:GET", db.UserRole):    true,
			fmt.Sprintf("%s:POST", db.UserRole):   true,
			fmt.Sprintf("%s:PATCH", db.UserRole):  true,
			fmt.Sprintf("%s:DELETE", db.UserRole): true,
		},
		"/v2/public/": {
			fmt.Sprintf("%s:GET", db.UserRole):     true,
			fmt.Sprintf("%s:POST", db.UserRole):    true,
			fmt.Sprintf("%s:OPTIONS", db.UserRole): true,

			fmt.Sprintf("%s:GET", db.VisitorRole):     true,
			fmt.Sprintf("%s:POST", db.VisitorRole):    true,
			fmt.Sprintf("%s:OPTIONS", db.VisitorRole): true,
		},
	}

	routeRulesTree := qradix.NewRTree()
	for prefix, rules := range prefixRules {
		routeRulesTree.Insert(prefix, rules)
	}

	handlers := &MultiUsersSvc{
		cfg:        cfg,
		deps:       deps,
		apiACRules: apiACRules,
		routeRules: routeRulesTree,
	}

	return handlers, nil
}

type LoginReq struct {
	User         string `json:"user"`
	Pwd          string `json:"pwd"`
	CaptchaID    string `json:"captchaId"`
	CaptchaInput string `json:"captchaInput"`
}

func (h *MultiUsersSvc) Login(c *gin.Context) {
	req := &LoginReq{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(q.ErrResp(c, 400, err))
		return
	}

	// TODO: add rate limiter for verifying
	// captchaEnabled := h.cfg.BoolOr("Users.CaptchaEnabled", true)
	// if captchaEnabled {
	// 	if !captcha.VerifyString(req.CaptchaID, req.CaptchaInput) {
	// 		c.JSON(q.ErrResp(c, 403, errors.New("login failed")))
	// 		return
	// 	}
	// }

	user, err := h.deps.Users().GetUserByName(c, req.User)
	if err != nil {
		if errors.Is(err, db.ErrUserNotFound) {
			c.JSON(q.ErrResp(c, 403, err))
			return
		}
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Pwd), []byte(req.Pwd))
	if err != nil {
		c.JSON(q.ErrResp(c, 403, err))
		return
	}

	ttl := h.cfg.GrabInt("Users.CookieTTL")
	token, err := h.deps.Token().ToToken(map[string]string{
		q.UserIDParam: fmt.Sprint(user.ID),
		q.UserParam:   user.Name,
		q.RoleParam:   user.Role,
		q.ExpireParam: fmt.Sprintf("%d", time.Now().Unix()+int64(ttl)),
	})
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	// secure := h.cfg.GrabBool("Users.CookieSecure")
	// httpOnly := h.cfg.GrabBool("Users.CookieHttpOnly")
	// c.SetCookie(q.TokenCookie, token, ttl, "/", "", secure, httpOnly)
	cookie := &http.Cookie{
		Name:   q.TokenCookie,
		Value:  token,
		MaxAge: ttl, // MaxAge is in seconds
		Path:   "/",
		// Domain:   ".app.github.dev", // Or ".yourdomain.com" for production
		Domain:   "localhost", // Or ".yourdomain.com" for production
		Secure:   true,        // Set to true for HTTPS in production
		HttpOnly: false,
		SameSite: http.SameSiteNoneMode, // Or http.SameSiteLaxMode, http.SameSiteStrictMode
	}
	// If SameSite is None, Secure MUST be true.
	// If you're on http://localhost, use SameSiteLaxMode or StrictMode for now.
	if cookie.SameSite == http.SameSiteNoneMode && !cookie.Secure {
		// Browser will reject SameSite=None without Secure
		// Consider changing SameSite or using HTTPS for local development
		// Or set Secure to true and use https://localhost (requires setup)
		log.Println("Warning: SameSite=None cookie without Secure=true will likely be rejected by browsers.")
	}
	http.SetCookie(c.Writer, cookie)

	c.JSON(200, gin.H{"token": token})
}

type LogoutReq struct{}

func (h *MultiUsersSvc) Logout(c *gin.Context) {
	// token alreay verified in the authn middleware
	// secure := h.cfg.GrabBool("Users.CookieSecure")
	// httpOnly := h.cfg.GrabBool("Users.CookieHttpOnly")
	cookie := &http.Cookie{
		Name:     q.TokenCookie,
		Value:    "",
		MaxAge:   -1, // MaxAge is in seconds
		Path:     "/",
		Domain:   ".app.github.dev", // Or ".yourdomain.com" for production
		Secure:   true,              // Set to true for HTTPS in production
		HttpOnly: false,
		SameSite: http.SameSiteNoneMode, // Or http.SameSiteLaxMode, http.SameSiteStrictMode
	}
	http.SetCookie(c.Writer, cookie)
	c.JSON(q.Resp(200))
}

func (h *MultiUsersSvc) IsAuthed(c *gin.Context) {
	// token alreay verified in the authn middleware
	c.JSON(q.Resp(200))
}

type SetPwdReq struct {
	OldPwd string `json:"oldPwd"`
	NewPwd string `json:"newPwd"`
}

func (h *MultiUsersSvc) SetPwd(c *gin.Context) {
	req := &SetPwdReq{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(q.ErrResp(c, 400, err))
		return
	} else if req.OldPwd == req.NewPwd {
		c.JSON(q.ErrResp(c, 400, errors.New("password is not updated")))
		return
	}

	claims, err := h.getUserInfo(c)
	if err != nil {
		c.JSON(q.ErrResp(c, 403, err))
		return
	}

	uid, err := strconv.ParseUint(claims[q.UserIDParam], 10, 64)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	user, err := h.deps.Users().GetUser(c, uid)
	if err != nil {
		c.JSON(q.ErrResp(c, 402, err))
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Pwd), []byte(req.OldPwd))
	if err != nil {
		c.JSON(q.ErrResp(c, 403, ErrInvalidUser))
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPwd), 10)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, errors.New("fail to set password")))
		return
	}

	err = h.deps.Users().SetPwd(c, uid, string(newHash))
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	c.JSON(q.Resp(200))
}

type ForceSetPwdReq struct {
	ID     string `json:"id"`
	NewPwd string `json:"newPwd"`
}

func (h *MultiUsersSvc) ForceSetPwd(c *gin.Context) {
	req := &ForceSetPwdReq{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(q.ErrResp(c, 400, err))
		return
	}

	targetUID, err := strconv.ParseUint(req.ID, 10, 64)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}
	targetUser, err := h.deps.Users().GetUser(c, targetUID)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}
	if targetUser.Role == db.AdminRole {
		c.JSON(q.ErrResp(c, 403, errors.New("can not set admin's password")))
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPwd), 10)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, errors.New("fail to set password")))
		return
	}

	err = h.deps.Users().SetPwd(c, targetUser.ID, string(newHash))
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	c.JSON(q.Resp(200))
}

type AddUserReq struct {
	Name string `json:"name"`
	Pwd  string `json:"pwd"`
	Role string `json:"role"`
}

type AddUserResp struct {
	ID string `json:"id"`
}

func (h *MultiUsersSvc) AddUser(c *gin.Context) {
	req := &AddUserReq{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(q.ErrResp(c, 400, err))
		return
	}

	// Role and duplicated name will be validated by the store
	var err error
	if err = h.isValidUserName(req.Name); err != nil {
		c.JSON(q.ErrResp(c, 400, err))
		return
	} else if err = h.isValidPwd(req.Pwd); err != nil {
		c.JSON(q.ErrResp(c, 400, err))
		return
	}

	uid := h.deps.ID().Gen()
	pwdHash, err := bcrypt.GenerateFromPassword([]byte(req.Pwd), 10)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	// TODO: following operations must be atomic
	// TODO: check if the folders already exists
	fsRootFolder := q.FsRootPath(req.Name, "/")
	if err = h.deps.FS().MkdirAll(fsRootFolder); err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}
	uploadFolder := q.UploadFolder(req.Name)
	if err = h.deps.FS().MkdirAll(uploadFolder); err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	newPreferences := db.DefaultPreferences
	err = h.deps.Users().AddUser(c, &db.User{
		ID:   uid,
		Name: req.Name,
		Pwd:  string(pwdHash),
		Role: req.Role,
		Quota: &db.Quota{
			SpaceLimit:         int64(h.cfg.IntOr("Users.SpaceLimit", 100*1024*1024)), // TODO: support int64
			UploadSpeedLimit:   h.cfg.IntOr("Users.UploadSpeedLimit", 100*1024),
			DownloadSpeedLimit: h.cfg.IntOr("Users.DownloadSpeedLimit", 100*1024),
		},
		Preferences: &newPreferences,
	})
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	c.JSON(200, &AddUserResp{ID: fmt.Sprint(uid)})
}

type DelUserResp struct {
	ID string `json:"id"`
}

func (h *MultiUsersSvc) DelUser(c *gin.Context) {
	userIDStr := c.Query(q.UserIDParam)
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		c.JSON(q.ErrResp(c, 400, fmt.Errorf("invalid users ID %w", err)))
		return
	} else if userID == 0 || userID == 1 { // 0=root, 1=visitor
		c.JSON(q.ErrResp(c, 400, errors.New("It is not allowed to delete predefined users")))
		return
	}

	claims, err := h.getUserInfo(c)
	if err != nil {
		c.JSON(q.ErrResp(c, 403, err))
		return
	}
	if claims[q.UserIDParam] == userIDStr {
		c.JSON(q.ErrResp(c, 403, errors.New("can not delete self")))
		return
	}

	// TODO: try to make following atomic
	err = h.deps.Users().DelUser(c, userID)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	// TODO: move the folder to recycle bin when it failed to remove it
	homePath := userIDStr
	if err = h.deps.FS().Remove(homePath); err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}
	c.JSON(200, &DelUserResp{ID: userIDStr})
}

type ListUsersResp struct {
	Users []*db.User `json:"users"`
}

func (h *MultiUsersSvc) ListUsers(c *gin.Context) {
	// TODO: pagination is not enabled
	// lastID := 0
	// lastIDStr := c.Query(q.LastID)
	// if lastIDStr != "" {
	// 	lastID, err := strconv.Atoi(lastIDStr)
	// 	if err != nil {
	// 		c.JSON(q.ErrResp(c, 400, fmt.Errorf("invalid param %w", err)))
	// 		return
	// 	}
	// }

	users, err := h.deps.Users().ListUsers(c)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}
	c.JSON(200, &ListUsersResp{Users: users})
}

type AddRoleReq struct {
	Role string `json:"role"`
}

func (h *MultiUsersSvc) AddRole(c *gin.Context) {
	var err error
	req := &AddRoleReq{}
	if err = c.ShouldBindJSON(&req); err != nil {
		c.JSON(q.ErrResp(c, 400, err))
		return
	}

	if err = h.isValidRole(req.Role); err != nil {
		c.JSON(q.ErrResp(c, 400, err))
		return
	}

	err = h.deps.Users().AddRole(req.Role)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	c.JSON(q.Resp(200))
}

type DelRoleReq struct {
	Role string `json:"role"`
}

func (h *MultiUsersSvc) DelRole(c *gin.Context) {
	var err error
	req := &DelRoleReq{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(q.ErrResp(c, 400, err))
		return
	}

	if err = h.isValidRole(req.Role); err != nil {
		c.JSON(q.ErrResp(c, 400, err))
		return
	}

	err = h.deps.Users().DelRole(req.Role)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	c.JSON(q.Resp(200))
}

type ListRolesReq struct{}
type ListRolesResp struct {
	Roles map[string]bool `json:"roles"`
}

func (h *MultiUsersSvc) ListRoles(c *gin.Context) {
	// TODO: currently roles are hardcoded
	c.JSON(200, &ListRolesResp{
		Roles: map[string]bool{
			db.AdminRole:   true,
			db.UserRole:    true,
			db.VisitorRole: true,
		}})
}

func (h *MultiUsersSvc) getUserInfo(c *gin.Context) (map[string]string, error) {
	tokenStr, err := c.Cookie(q.TokenCookie)
	if err != nil {
		return nil, err
	}
	claims, err := h.deps.Token().FromToken(
		tokenStr,
		map[string]string{
			q.UserIDParam: "",
			q.UserParam:   "",
			q.RoleParam:   "",
			q.ExpireParam: "",
		},
	)
	if err != nil {
		return nil, err
	} else if claims[q.UserIDParam] == "" || claims[q.UserParam] == "" {
		return nil, ErrInvalidConfig
	}

	return claims, nil
}

func (h *MultiUsersSvc) isValidUserName(userName string) error {
	minUserNameLen := h.cfg.GrabInt("Users.MinUserNameLen")
	if len(userName) < minUserNameLen {
		return errors.New("name is too short")
	}
	return nil
}

func (h *MultiUsersSvc) isValidPwd(pwd string) error {
	minPwdLen := h.cfg.GrabInt("Users.MinPwdLen")
	if len(pwd) < minPwdLen {
		return errors.New("password is too short")
	}
	return nil
}

func (h *MultiUsersSvc) isValidRole(role string) error {
	if role == db.AdminRole || role == db.UserRole || role == db.VisitorRole {
		return errors.New("predefined roles can not be added/deleted")
	}
	return h.isValidUserName(role)
}

type SelfResp struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Role        string          `json:"role"`
	Quota       *db.Quota       `json:"quota"`
	UsedSpace   int64           `json:"usedSpace,string"`
	Preferences *db.Preferences `json:"preferences"`
}

func (h *MultiUsersSvc) Self(c *gin.Context) {
	claims, err := h.getUserInfo(c)
	if err != nil {
		c.JSON(q.ErrResp(c, 403, err))
		return
	}

	user, err := h.deps.Users().GetUserByName(c, claims[q.UserParam])
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	allowSetBg := h.cfg.BoolOr("Server.Dynamic.ClientCfg.AllowSetBg", false)
	if !allowSetBg {
		user.Preferences.Bg = db.DefaultBgConfig
	}

	c.JSON(200, &SelfResp{
		ID:          claims[q.UserIDParam],
		Name:        claims[q.UserParam],
		Role:        claims[q.RoleParam],
		Quota:       user.Quota,
		UsedSpace:   user.UsedSpace,
		Preferences: user.Preferences,
	})
}

type SetUserReq struct {
	ID        uint64    `json:"id,string"`
	Role      string    `json:"role"`
	UsedSpace int64     `json:"usedSpace,string"`
	Quota     *db.Quota `json:"quota"`
}

func (h *MultiUsersSvc) SetUser(c *gin.Context) {
	req := &SetUserReq{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	err := h.deps.Users().SetInfo(c, req.ID, &db.User{
		Role:  req.Role,
		Quota: req.Quota,
	})
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	c.JSON(q.Resp(200))
}

type SetPreferencesReq struct {
	Preferences *db.Preferences `json:"preferences"`
}

func (h *MultiUsersSvc) SetPreferences(c *gin.Context) {
	req := &SetPreferencesReq{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(q.ErrResp(c, 400, err))
		return
	}

	uidStr := c.MustGet(q.UserIDParam).(string)
	uid, err := strconv.ParseUint(uidStr, 10, 64)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}

	allowSetBg := h.cfg.BoolOr("Server.Dynamic.ClientCfg.AllowSetBg", false)
	if !allowSetBg {
		req.Preferences.Bg = db.DefaultBgConfig
	}

	err = h.deps.Users().SetPreferences(c, uid, req.Preferences)
	if err != nil {
		c.JSON(q.ErrResp(c, 500, err))
		return
	}
	c.JSON(q.Resp(200))
}
