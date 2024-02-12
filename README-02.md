## Run CloudshellWrapper Go Code
```Shell
vscode ➜ /workspaces/topoViewer (development) $ pwd
/workspaces/topoViewer
vscode ➜ /workspaces/topoViewer (development) $ go run go_cloudshellwrapper/cmd/main.go --help
vscode ➜ /workspaces/topoViewer (development) $ go run go_cloudshellwrapper/cmd/main.go clab -H 138.203.40.63 -t rawTopoFile/clab-topo-file.yaml ## obsolete
vscode ➜ /workspaces/topoViewer (development) $ go run go_cloudshellwrapper/cmd/main.go clab -j rawTopoFile/clab-Vodafone-CO-HCO/topology-data.json   -H 138.203.
40.63 -u suuser ## obsolete
vscode ➜ /workspaces/topoViewer (development) $ go run go_cloudshellwrapper/cmd/main.go clab -j rawTopoFile/clab/bng-cups/clab-cups/topology-data.json   -H 138.2
03.40.63 -u root

138.203.26.59


```


```Shell
vscode ➜ /workspaces/topoViewer (development ✗) $≈nsp  -H 138.203.40.63 --topology-ietf-l2-topo  rawTopoFile/topo-ietf-L2
.json --topology-ietf-l3-topo rawTopoFile/topo-ietf-L3-TopologyId-1\:65000\:1-isis.json --multi-layer enabled
```


## Build TopoViewer Binary - Linux
build linux amd64 binary
```Shell
vscode ➜ /workspaces/topoViewer (development) $ GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o topoviewer cloudshellwrapper/cmd/main.go 
```

## Run TopoViewer Binary 
Ensure to run binary file in the same directory with html folder
Running inside dist folder
```Shell
vscode ➜ /workspaces/topoViewer/dist (development ✗) $ ./topoviewer clab -t topo-topoViewerDemo.yaml  
```

## Create Distribution Folder
```Shell
vscode ➜ /workspaces/topoViewer (development ✗) $ ./tools/dist.sh 
```

# BNG-CUPS
## BNG-CUPS Deploy CLAB
[suuser@nsp-kvm-host-antwerp bng-cups]$ sudo clab deploy -t cups.yml --debug --export-template /home/suuser/topoViewer/rawTopoFile/clab-topo-export-template/c
lab-topo-cytoscape.tmpl 


## NSP IETF L2 run topoViewer
[root@kvm-host-antwerp02 topoViewer]# go run cloudshellwrapper/cmd/main.go nsp -H 138.203.26.59 --topology-ietf-l2-topo rawTopoFile/ietf-topo-examples/ietf-L2
.json --multi-layer disable

## BNG-CUPS run topoViewer inside docker 
docker exec -it clab-nokia-MAGc-lab-topoviewer /opt/topoviewer/topoviewer clab -H 138.203.26.59 -P 8080 -u suuser -p Lab-Her0 -j local-bind/topo-file.json


## Run TopoViewer Code
```Shell
go run go_cloudshellwrapper/cmd/main.go clab --allowed-hostnames 149.204.21.68 --clab-user aarafat  --server-port 8087 --topology-file-json ./rawTopoFile/clab/nokia-MultiAccessGateway-lab/clab-nokia-MAGc-lab/topology-data.json 

vscode ➜ /workspaces/topoViewer/dist (development ✗) $ ./topoviewer clab -t topo-topoViewerDemo.yaml  
```




func SendSnmpToNodeWalk(name string, targetAddress string, targetCommunity string, rootOID string, targetVersion g.SnmpVersion) {

	g := &gosnmp.GoSNMP{
		Target:    targetAddress,
		Port:      uint16(161),
		Community: targetCommunity,
		Version:   targetVersion,
		Timeout:   time.Duration(5) * time.Second,
	}

	interfaceOIDList := []string{".1.3.6.1.2.1.31.1.1.1.1", // ifName
		".1.3.6.1.2.1.2.2.1.2", // ifDescr
		".1.3.6.1.2.1.2.2.1.4", // ifMtu
		".1.3.6.1.2.1.2.2.1.6", // ifPhysAddress
		".1.3.6.1.2.1.2.2.1.3", // ifType
		".1.3.6.1.2.1.2.2.1.7", // ifAdminStatus
		".1.3.6.1.2.1.2.2.1.8"} // ifOperStatus

	ifEntries := make(map[string]map[string]string)

	for _, rootOID := range interfaceOIDList {

		err := g.Connect()
		if err != nil {
			log.Errorf("Connect() error: %v", err)
			return
		}
		defer g.Conn.Close()

		result, err := g.WalkAll(rootOID)
		if err != nil {
			log.Errorf("WalkAll() error: %v", err)
			return
		}

		// Print the SNMP walk results
		for _, pdu := range result {

			ifEntry := make(map[string]string)
			

			if rootOID == ".1.3.6.1.2.1.31.1.1.1.1" { // ifName
				octetString := pdu.Value.([]byte)
				fmt.Printf("Interface Name: %s\n", octetString)
				ifEntry["ifName"] = string(octetString)

				key := string(octetString)
				ifEntries[key] = map[string]string{
					"port-id":     ifEntry["ifName"],
					"description": ifEntry["ifDescr"],
					"mtu":         ifEntry["ifMtu"],
					"mac-address": ifEntry["ifPhysAddress"],
					"admin-state": ifEntry["ifAdminStatus"],
					"oper-state":  ifEntry["ifOperStatus"],
				}
			}
			if rootOID == ".1.3.6.1.2.1.2.2.1.6" {
				octetString := pdu.Value.([]byte)
				macBytes := octetString[:6] // Extract the first 6 bytes
				macAddr := fmt.Sprintf("%02X:%02X:%02X:%02X:%02X:%02X", macBytes[0], macBytes[1], macBytes[2], macBytes[3], macBytes[4], macBytes[5])
				fmt.Printf("MAC Address: %s\n", macAddr)

			} else if rootOID == ".1.3.6.1.2.1.2.2.1.2" { // ifDescr
				octetString := pdu.Value.([]byte)
				fmt.Printf("Interface Description: %s\n", octetString)

			} else if rootOID == ".1.3.6.1.2.1.2.2.1.4" { // ifMtu
				fmt.Printf("Interface MTU, PDU Type is INTEGER, PDU value is: %d\n", gosnmp.ToBigInt(pdu.Value))

			} else if rootOID == ".1.3.6.1.2.1.2.2.1.3" { // ifType
				// fmt.Printf("Interface Type, PDU Type is INTEGER, PDU value is: %d\n", gosnmp.ToBigInt(pdu.Value))
				fmt.Printf("Interface Type, PDU value is: %s\n", (pdu.Value))

				//////
				// ifType OBJECT-TYPE
				//   SYNTAX  INTEGER {
				//               other(1),
				//               regular1822(2),
				//               hdh1822(3),
				//               ddn-x25(4),
				//               rfc877-x25(5),
				//               ethernet-csmacd(6),
				//               iso88023-csmacd(7),
				//               iso88024-tokenBus(8),
				//               iso88025-tokenRing(9),
				//               iso88026-man(10),
				//               starLan(11),
				//               proteon-10Mbit(12),
				//               proteon-80Mbit(13),
				//               hyperchannel(14),
				//               fddi(15),
				//               lapb(16),
				//               sdlc(17),
				//               ds1(18),
				//               e1(19),
				//               basicISDN(20),
				//               primaryISDN(21),
				//               propPointToPointSerial(22),
				//               ppp(23),
				//               softwareLoopback(24),
				//               eon(25),
				//               ethernet-3Mbit(26),
				//               nsip(27),
				//               slip(28),
				//               ultra(29),
				//               ds3(30),
				//               sip(31),
				//               frame-relay(32)
				//				 ipForward(142)
				//           }
				//   ACCESS  read-only
				//   STATUS  mandatory
				//   DESCRIPTION
				//           "The type of interface, distinguished according to
				//           the physical/link protocol(s) immediately `below'
				//           the network layer in the protocol stack."
				//   ::= { ifEntry 3 }
				//////

			} else if rootOID == ".1.3.6.1.2.1.2.2.1.7" { // ifAdminStatus
				fmt.Printf("Interface Admin Status, PDU value is: %s\n", (pdu.Value))

				// ifAdminStatus OBJECT-TYPE
				// SYNTAX  INTEGER {
				// 			up(1),
				// 			down(2),
				// 			testing(3)
				// 		}
				// ACCESS  read-write
				// STATUS  mandatory
				// DESCRIPTION
				// 		"The desired state of the interface.  The
				// 		testing(3) state indicates that no operational
				// 		packets can be passed."
				// ::= { ifEntry 7 }

			} else if rootOID == ".1.3.6.1.2.1.2.2.1.8" { // ifOperStatus
				fmt.Printf("Interface Oper Status, PDU value is: %s\n", (pdu.Value))

				// ifOperStatus OBJECT-TYPE
				// SYNTAX INTEGER {
				// 			up(1), -- ready to pass packets
				// 			down(2),
				// 			testing(3) -- in some test mode
				// 		}
				// ACCESS read-only
				// STATUS mandatory
				// DESCRIPTION
				// "The current operational state of the interface. The testing(3) state indicates that no operational packets can be passed."

			} else {
				switch pdu.Type {
				case gosnmp.OctetString:
					octetString := pdu.Value.([]byte)
					fmt.Printf("STRING: %s\n", string(octetString))

				case gosnmp.Integer:
					fmt.Printf("INTEGER: %d\n", gosnmp.ToBigInt(pdu.Value))

				case gosnmp.Counter32:
					fmt.Printf("COUNTER32: %d\n", gosnmp.ToBigInt(pdu.Value))

				case gosnmp.Counter64:
					fmt.Printf("COUNTER64: %d\n", gosnmp.ToBigInt(pdu.Value))

				case gosnmp.Gauge32:
					fmt.Printf("GAUGE32: %d\n", gosnmp.ToBigInt(pdu.Value))

				case gosnmp.TimeTicks:
					fmt.Printf("TIMETICKS: %d\n", gosnmp.ToBigInt(pdu.Value))

				default:
					fmt.Printf("TYPE %d: %d\n", pdu.Type, gosnmp.ToBigInt(pdu.Value))
				}
			}
		}

	}

	fmt.Printf("TYPE %v: n", ifEntries)

}