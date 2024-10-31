package tools

import (
	"context"
	"fmt"

	"github.com/openconfig/gnmic/pkg/api"
	log "github.com/sirupsen/logrus"
	"google.golang.org/protobuf/encoding/prototext"
)

// test gMNIc
func SendGnmicToNodeCapabilities(targetName, targetAddress, targetPort, targetUsername, targetPassword string, skipVerifyFlag bool, insecureFlag bool) {
	// create a target
	tg, err := api.NewTarget(
		api.Name(targetName),
		api.Address(fmt.Sprintf("%s:%s", targetAddress, targetPort)),
		api.Username(targetUsername),
		api.Password(targetPassword),
		api.SkipVerify(skipVerifyFlag),
		api.Insecure(insecureFlag),
	)
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// create a gNMI client
	err = tg.CreateGNMIClient(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer tg.Close()

	// send a gNMI capabilities request to the created target
	capResp, err := tg.Capabilities(ctx)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(prototext.Format(capResp))
}

func SendGnmicToNodeGet(targetName string, targetAddress string, targetUsername string, targetPassword string, skipVerifyFlag bool, insecureFlag bool, path string) {
	// create a target
	tg, err := api.NewTarget(
		api.Name(targetName),
		api.Address(targetAddress+":57400"),
		api.Username(targetUsername),
		api.Password(targetPassword),
		api.SkipVerify(skipVerifyFlag),
		api.Insecure(insecureFlag),
	)
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// create a gNMI client
	err = tg.CreateGNMIClient(ctx)
	if err != nil {
		log.Fatal(err)
	}
	defer tg.Close()

	// create a GetRequest
	getReq, err := api.NewGetRequest(
		api.Path(path),
		api.Encoding("json_ietf"))
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(prototext.Format(getReq))

	// send the created gNMI GetRequest to the created target
	getResp, err := tg.Get(ctx, getReq)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(prototext.Format(getResp))
}
