package tools

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"strings"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/spf13/viper"

	"github.com/buger/jsonparser"
	log "github.com/sirupsen/logrus"

	"os"
)

type RestconfManager struct {
	Username      string `json:"username"`
	Password      string `json:"password"`
	ServerAddr    string `json:"serverAddr"`
	IpAdressNspOs string `json:"ipAdressNspOs"`
	IpAdressIprc  string `json:"ipAdressIprc"`
	Base64Str     string `json:"base64Str"`
	Token         string `json:"token"`
	Proxy         Proxy
}

type Proxy struct {
	Enable       string
	ProxyAddress string
}

func (r *RestconfManager) RestconfManagerLoadConfig() {
	viper.SetConfigName("nspConfig") // config file name without extension
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./nspGo-session/cmd") // config file path
	viper.AutomaticEnv()                       // read value ENV variable

	err := viper.ReadInConfig()
	if err != nil {
		fmt.Println("fatal error config file: default \n", err)
		os.Exit(1)
	}
	// Set default value
	viper.SetDefault("nsp.linetoken", "DefaultLineTokenValue")

	// pass to struct data
	//env := viper.GetString("nsp.env")
	r.IpAdressNspOs = viper.GetString("nsp.nspOsIP")
	r.IpAdressIprc = viper.GetString("nsp.nspIprcIP")
	r.Username = viper.GetString("nsp.username")
	r.Password = viper.GetString("nsp.Password")
	r.Token = viper.GetString("nsp.linetoken")
	r.Proxy.Enable = viper.GetString("nsp.proxy.enable")
	r.Proxy.ProxyAddress = viper.GetString("nsp.proxy.proxyAddress")

	// Print
	// fmt.Println("---------- Example ----------")
	// fmt.Println("nsp.env :", env)
	// fmt.Println("nsp.nspOsIP :", s.IpAdressNspOs)
	// fmt.Println("nsp.nspIprcIP :", s.IpAdressIprc)
	// fmt.Println("nsp.linetoken :", s.IpAdressIprc)

}

func (r *RestconfManager) RestconfManagerEncodeUserName() string {
	var plainCredentials strings.Builder
	plainCredentials.WriteString(r.Username)
	plainCredentials.WriteString(":")
	plainCredentials.WriteString(r.Password)

	//fmt.Println(plainCredentials.String())

	var base64Credentials string = base64.StdEncoding.EncodeToString([]byte(plainCredentials.String()))
	//fmt.Println(base64Credentials)
	r.Base64Str = base64Credentials
	return r.Base64Str
}

func (r *RestconfManager) RestconfManagerGetExample() {
	// Create a Resty Client
	client := resty.New()

	resp, err := client.R().
		EnableTrace().
		Get("https://httpbin.org/get")

	if err != nil {
		fmt.Println(err)
		return
	}
	// Explore response object
	fmt.Println("Response Info:")
	fmt.Println("  Error      :", err)
	fmt.Println("  Status Code:", resp.StatusCode())
	fmt.Println("  Status     :", resp.Status())
	fmt.Println("  Proto      :", resp.Proto())
	fmt.Println("  Time       :", resp.Time())
	fmt.Println("  Received At:", resp.ReceivedAt())
	fmt.Println("  Body       :\n", resp)
	fmt.Println()
	// Explore trace info
	fmt.Println("Request Trace Info:")
	ti := resp.Request.TraceInfo()
	fmt.Println("  DNSLookup     :", ti.DNSLookup)
	fmt.Println("  ConnTime      :", ti.ConnTime)
	fmt.Println("  TCPConnTime   :", ti.TCPConnTime)
	fmt.Println("  TLSHandshake  :", ti.TLSHandshake)
	fmt.Println("  ServerTime    :", ti.ServerTime)
	fmt.Println("  ResponseTime  :", ti.ResponseTime)
	fmt.Println("  TotalTime     :", ti.TotalTime)
	fmt.Println("  IsConnReused  :", ti.IsConnReused)
	fmt.Println("  IsConnWasIdle :", ti.IsConnWasIdle)
	fmt.Println("  ConnIdleTime  :", ti.ConnIdleTime)
	fmt.Println("  RequestAttempt:", ti.RequestAttempt)
	fmt.Println("  RemoteAddr    :", ti.RemoteAddr.String())
}

func (r *RestconfManager) RestconfManagerInitLogger() {
	// init logConfig
	toolLogger := Logs{}
	toolLogger.InitLogger("./logs/tools-restconfManager.log", 5)
}

func (r *RestconfManager) RestconfManagerGetToken() {
	client := resty.New()
	client.SetTimeout(20 * time.Second)
	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	if r.Proxy.Enable == "true" {
		client.SetProxy(r.Proxy.ProxyAddress)
	}

	// POST JSON string
	// No need to set content type, if you have client level setting
	//
	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("authorization", "Basic "+r.Base64Str).
		SetBody(`{ "grant_type": "client_credentials" }`).
		//Post("https://172.23.160.37/rest-gateway/rest/api/v1/auth/token")
		// Post("https://" + r.IpAdressNspOs + nspgoconstants.GLBL_NSP_SESSION_URL_TOKEN)
		Post("https://" + r.IpAdressNspOs + "/rest-gateway/rest/api/v1/auth/token")

	log.Info("get token is success: ", resp.IsSuccess())
	log.Debug("get token debugL ", resp)

	if err != nil {
		log.Error("token revoke not succesful", err)
		return
	}

	// fmt.Println("  resp type       :")
	// fmt.Println(reflect.TypeOf(resp))

	//// print the response body
	//
	// s.Token = string(resp.Body())
	// fmt.Println("  Token       :\n", s.Token)
	// fmt.Println("Response Body Access Token:")
	// fmt.Println(jsonparser.GetString([]byte(string(resp.Body())), "access_token"))

	//// jsonparser.GetString return two variable "VEtOLWFkbWluYzkyM2RlNjMtZjJhNy00ZGUxLThlMmUtNGUxZjBiMzcyMDM3" type string and <nil> type error"
	//// the code only interested is the first one.
	//
	// var token string
	// fmt.Println(reflect.TypeOf(jsonparser.GetString([]byte(string(resp.Body())), "token_type")))
	// token, _ = jsonparser.GetString([]byte(string(resp.Body())), "access_token")
	// fmt.Println(token)

	r.Token, _ = jsonparser.GetString([]byte(string(resp.Body())), "access_token")
}

func (r *RestconfManager) RestconfManagerRevokeToken() {
	client := resty.New()
	client.SetTimeout(20 * time.Second)
	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	if r.Proxy.Enable == "true" {
		client.SetProxy(r.Proxy.ProxyAddress)
	}

	// POST JSON string
	// No need to set content type, if you have client level setting
	//
	resp, err := client.R().
		SetHeader("Content-Type", "application/x-www-form-urlencoded").
		SetHeader("authorization", "Basic "+r.Base64Str).
		SetBody("token=" + r.Base64Str + "&token_type_hint=token").
		//Post("https://172.23.160.37/rest-gateway/rest/api/v1/auth/revocation")
		// Post("https://" + s.IpAdressNspOs + nspgoconstants.GLBL_NSP_SESSION_URL_TOKEN_REVOKE)
		Post("https://" + r.IpAdressNspOs + "/rest-gateway/rest/api/v1/auth/revocation")

	log.Info("revoke token is success: ", resp.IsSuccess())

	if err != nil {
		log.Error("token revoke not succesful", err)
		return
	}
}

func (r *RestconfManager) RestconfManagerPost(url string, proxyEnable bool, asycn bool, payload interface{}) (result string) {
	client := resty.New()
	client.SetTimeout(20 * time.Second)
	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	if r.Proxy.Enable == "true" {
		client.SetProxy(r.Proxy.ProxyAddress)
	}

	// POST JSON string
	// No need to set content type, if you have client level setting
	//
	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("authorization", "Basic "+r.Base64Str).
		SetBody(`{ "grant_type": "client_credentials" }`).
		//Post("https://172.23.160.37/rest-gateway/rest/api/v1/auth/token")
		// Post("https://" + r.IpAdressNspOs + nspgoconstants.GLBL_NSP_SESSION_URL_TOKEN)
		Get("https://" + r.IpAdressNspOs + "/rest-gateway/rest/api/v1/auth/token") // this is url hardcoded

	log.Info("get token is success: ", resp.IsSuccess())
	log.Debug("get token debugL ", resp)

	if err != nil {
		log.Error("token revoke not succesful", err)
		return
	}

	r.Token, _ = jsonparser.GetString([]byte(string(resp.Body())), "access_token")
	return resp.String()
}

func (r *RestconfManager) RestconfManagerGet(url string, proxyEnable bool, asycn bool, payload interface{}) (result string) {
	client := resty.New()
	client.SetTimeout(20 * time.Second)
	client.SetTLSClientConfig(&tls.Config{InsecureSkipVerify: true})
	if r.Proxy.Enable == "true" {
		client.SetProxy(r.Proxy.ProxyAddress)
	}

	// POST JSON string
	// No need to set content type, if you have client level setting
	//
	resp, err := client.R().
		SetHeader("Content-Type", "application/json").
		SetHeader("authorization", "Basic "+r.Base64Str).
		SetBody(`{ "grant_type": "client_credentials" }`).
		//Post("https://172.23.160.37/rest-gateway/rest/api/v1/auth/token")
		// Post("https://" + r.IpAdressNspOs + nspgoconstants.GLBL_NSP_SESSION_URL_TOKEN)
		Post("https://" + r.IpAdressNspOs + "/restconf/data/ietf-network:networks") // this is url hardcoded

	log.Info("get token is success: ", resp.IsSuccess())
	log.Debug("get token debugL ", resp)

	if err != nil {
		log.Error("token revoke not succesful", err)
		return
	}

	r.Token, _ = jsonparser.GetString([]byte(string(resp.Body())), "access_token")
	return resp.String()
}
