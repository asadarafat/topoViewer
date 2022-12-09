var RuntimeException = Java.type('java.lang.RuntimeException');

fwkUtils = load({
    script: resourceProvider.getResource('utils.js'),
    name: 'fwkUtils'
});

utils = new fwkUtils();

function synchronize(input) {
  var startTS = Date.now();

  var target     = input.getTarget();
  var config     = JSON.parse(input.getJsonIntentConfiguration())[0]['day0-infra:day0-infra'];
  var state      = input.getNetworkState().name();
  var topology   = input.getCurrentTopology();
  var syncResult = synchronizeResultFactory.createSynchronizeResult();
  
  logger.info("iplink:synchronize(" + target + ") in state " + state);
  logger.info("iplink:synchronize(" + target + ") target nodes " + ibnService.getTargettedDevices("iplink", target) );

  var sitesConfigs = {};
  var sitesCleanups = {};
  var topologyObjects = [];
  
  if (topology != null) {
    // recall nodal configuration elements added before
    // existing configuration elements are subject for update or replacement
    topology.getXtraInfo().forEach(function(siteCfg) {
      var neId = siteCfg.getKey();
      //sitesConfigs[neId] = JSON.parse(siteCfg.getValue());
    })
  }
  
  if (state == "active") {
    var subnet = utils.getSubnet(target);    
    logger.info("subnet: " + subnet);
  
    var sites = [];
    sites.push(config["endpoint-a"]);
    // sites.push(config["endpoint-b"]);

    // sites[0]["ifname"] = "to_"+sites[1]["ne-name"];
    // sites[1]["ifname"] = "to_"+sites[0]["ne-name"];

    sites[0]["addr"] = subnet.split('/')[0];
    helper = subnet.split('/')[0].split('.');
    helper[3] = (parseInt(helper[3])+1).toString();
    sites[1]["addr"] = helper.join('.');
      
    // iterate sites to populate config
    sites.forEach(function(site) {
      var neId = site['ne-id'];
      var neInfo = mds.getAllInfoFromDevices(neId);
      
      if (null == neInfo || neInfo.size() === 0) {
        throw new RuntimeException("Node not found:" + neId);
      }
      
      var neFamilyTypeRelease = neInfo.get(0).getFamilyTypeRelease();
      if (neFamilyTypeRelease == null) {
        throw new RuntimeException("Can not get family/type/release for node: " + neId);
      }

      var neType = neFamilyTypeRelease.split(':')[0];
      var neVersion = neFamilyTypeRelease.split(':')[1];
      
      // Special hack to test openconfig
      if (neId=='10.0.0.18') {
        neType = "OpenConfig";
      }
      
      var siteTemplate = resourceProvider.getResource(neType+".ftl");
      var cfgs = JSON.parse(utilityService.processTemplate(siteTemplate, {'site': site, 'cfg': config, 'neVersion': neVersion}));

      if (!(neId in sitesConfigs)) {
        sitesConfigs[neId] = {};
      }
      sitesCleanups[neId] = {};
      
      for (var path in cfgs) {
        sitesConfigs[neId][path]  = {'name': cfgs[path]['name'], 'operation': 'replace', 'value': JSON.stringify(cfgs[path]['value'])};
        sitesCleanups[neId][path] = {'name': cfgs[path]['name'], 'operation': 'delete'};
        topologyObjects.push(topologyFactory.createTopologyObjectFrom(cfgs[path]['name'], path, "INFRASTRUCTURE", neId));
      }
    })
  }
                  
  if ((state=='active') || (state=='delete')) {
    var yangPatchTemplate = resourceProvider.getResource("patch.ftl");
      
    for (neId in sitesConfigs) {
      var baseURL = "/restconf/data/network-device-mgr:network-devices/network-device="+encodeURIComponent(neId)+"/root/";
      var yangPatch = utilityService.processTemplate(yangPatchTemplate, {'patchId': target, 'patchItems': sitesConfigs[neId]});
      logger.info(yangPatch);

      var managerInfo = mds.getAllManagersWithDevice(neId).get(0);
      restClient.setIp(managerInfo.getIp());
      restClient.setPort(managerInfo.getPort());
      restClient.setProtocol(managerInfo.getProtocol());
      
      try {
        utils.restPATCH(baseURL, yangPatch);
      } catch (e) {
        // stop-on-error
        syncResult.setSuccess(false);
        syncResult.setErrorCode("100");
        syncResult.setErrorDetail(e);
        return syncResult;
      }      
    }
    
    topology = topologyFactory.createServiceTopology();
    if (state == "delete") {
      utils.releaseSubnet(target);
      topology.setTopologyObjects([]);      
    } else {
      for (neId in sitesCleanups) {
        var xtrainfo = topologyFactory.createTopologyXtraInfoFrom(neId, JSON.stringify(sitesCleanups[neId]));
        topology.addXtraInfo(xtrainfo);
      }
      topology.setTopologyObjects(topologyObjects);
    }
  }
    
  var duration = Date.now()-startTS;
  logger.info("synchronize(" + target + ") finished within "+duration+" ms");

  syncResult.setTopology(topology);  
  syncResult.setSuccess(true);
  return syncResult;      
}
  
// todo:
//   error-handling to drive topology (cleanup & co)
//   error-handling for unsupported device families
//   support input admin-state
//   adding alternative audit using workflow / libyang
//   adding state: subnet used
//   adding state: operational up or down
//   assurance: multi-layer operational state (link layer, ip layer, igp layer)
//   assurance: EFM-OAM
//   assurance: Latency/Facility (link-layer)
//   assurance: Latency/TWAMP (IP layer)
//   assurance: LLDP (check cabling errors)
//   assurance: create telemetry subscrition for port/link performance

function audit(input) {
  var target     = input.getTarget();
  var config     = JSON.parse(input.getJsonIntentConfiguration())[0]['day0-infra:day0-infra'];
  var state      = input.getNetworkState().name();
  var topology   = input.getCurrentTopology();
  var syncResult = synchronizeResultFactory.createSynchronizeResult();
    
  var auditReport = auditFactory.createAuditReport(null, null);
  
  if (state=='active') {
    var subnet = utils.getSubnet(target);    
    logger.info("subnet: " + subnet);
  
    var sites = [];
    sites.push(config["endpoint-a"]);
    sites.push(config["endpoint-b"]);

    sites[0]["ifname"] = "to_"+sites[1]["ne-name"];
    sites[1]["ifname"] = "to_"+sites[0]["ne-name"];

    sites[0]["addr"] = subnet.split('/')[0];
    helper = subnet.split('/')[0].split('.');
    helper[3] = (parseInt(helper[3])+1).toString();
    sites[1]["addr"] = helper.join('.');
      
    // iterate sites to populate config
    sites.forEach(function(site) {
      var neId = site['ne-id'];
      var neInfo = mds.getAllInfoFromDevices(neId);
      
      if (null == neInfo || neInfo.size() === 0) {
        throw new RuntimeException("Node not found:" + neId);
      }
      
      var neFamilyTypeRelease = neInfo.get(0).getFamilyTypeRelease();
      if (neFamilyTypeRelease == null) {
        throw new RuntimeException("Can not get family/type/release for node: " + neId);
      }

      var neType = neFamilyTypeRelease.split(':')[0];
      var neVersion = neFamilyTypeRelease.split(':')[1];

      // Special hack to test openconfig
      if (neId=='10.0.0.18') {
        neType = "OpenConfig";
      }      

      var siteTemplate = resourceProvider.getResource(neType+".ftl");
      var cfgs = JSON.parse(utilityService.processTemplate(siteTemplate, {'site': site, 'cfg': config, 'neVersion': neVersion}));
      
      var baseURL = "/restconf/data/network-device-mgr:network-devices/network-device="+encodeURIComponent(neId)+"/root/";
      var managerInfo = mds.getAllManagersWithDevice(neId).get(0);
      restClient.setIp(managerInfo.getIp());
      restClient.setPort(managerInfo.getPort());
      restClient.setProtocol(managerInfo.getProtocol());

      for (path in cfgs) {
        var iCfg = cfgs[path]['value'];
        
        try {
          var aCfg = utils.restGET(baseURL+"/"+path);
          for (key in iCfg) {
            iCfg = iCfg[key];
            aCfg = aCfg[key][0];
            break;
          }
          
          logger.info("intended: "+JSON.stringify(iCfg));
          logger.info("actual:   "+JSON.stringify(aCfg));
                    
          utils.audit(aCfg, iCfg, auditReport, cfgs[path]['name'], '');
        } catch (e) {
          auditReport.addMisAlignedObject(auditFactory.createMisAlignedObject(path, false, neId));
        }
      }
    })
  }
    
  return auditReport;
};



function getRates(input) {
  var target = input.getTarget();
  var delay = utils.xml2object(input.getActionTreeElement())["port7x50:getRates"]['port7x50:duration']['content'];
  
  targetList = target.split('#');
  neId = targetList[0];
  portId = targetList[1];
  
  var managerInfo = mds.getAllManagersWithDevice(neId).get(0);
  restClient.setIp(managerInfo.getIp());
  restClient.setPort(managerInfo.getPort());

  var baseURL = "restconf/data/network-device-mgr:network-devices/network-device="+encodeURIComponent(neId)+"/root";
  var url = "/nokia-state:/state/port="+encodeURIComponent(portId)+"/statistics";
  
  response1 = utils.restGET(baseURL+url)["nokia-state:statistics"];
  java.lang.Thread.sleep(1000*delay);
  response2 = utils.restGET(baseURL+url)["nokia-state:statistics"];

  inOctets = response2["in-octets"]-response1["in-octets"];
  outOctets = response2["out-octets"]-response1["out-octets"];

  data = {};
  data['inRate'] = inOctets / 125 / delay;
  data['outRate'] = outOctets / 125 / delay;
  
  template = resourceProvider.getResource("rates.ftl");
  rvalue = utilityService.processTemplate(template, data);
  return rvalue;
};



function getStateAttributes(input) {
  var startTS = Date.now();

  var target = input.getTarget();
  logger.info("getStateAttributes(" + target + ") in state " + state);

  
  targetList = target.split('#');
  neId = targetList[0];
  portId = targetList[1];
  
  var managerInfo = mds.getAllManagersWithDevice(neId).get(0);
  restClient.setIp(managerInfo.getIp());
  restClient.setPort(managerInfo.getPort());

  var baseURL = "restconf/data/network-device-mgr:network-devices/network-device="+encodeURIComponent(neId)+"/root";
  var url = "/nokia-state:/state/port="+encodeURIComponent(portId);
  state = utils.restGET(baseURL+url)['nokia-state:port'][0]['oper-state'];
  
  var template = resourceProvider.getResource("state.ftl");
  rvalue = utilityService.processTemplate(template, {'operState': state});

  var duration = Date.now()-startTS;
  logger.info("getStateAttributes(" + target + ") finished within "+duration+" ms");

  return rvalue;
};



function getNodes(context) {
    logger.info(JSON.stringify(context.getInputValues()));

    var requestBody = {};
    requestBody["input"] = {'depth': 3, 'fields': 'ne-id;ne-name;type;version', 'xpath-filter': '/nsp-equipment:network/network-element'};

    if (context.getInputValues()["arguments"]["ne-id"]) {
      requestBody["input"]['xpath-filter'] = "/nsp-equipment:network/network-element[contains('ne-id', '" + context.getInputValues()["arguments"]["ne-id"] + "')]";
    }

    restClient.setIp('nsp-mdt-nsp-mediator-svc');
    restClient.setPort(80);
    restClient.setProtocol('http');
    var response = utils.restPOST('https://restconf-gateway:443/restconf/operations/nsp-inventory:find', JSON.stringify(requestBody))
    
    var neList = {};
    if (response["nsp-inventory:output"]) {
      neList = {"data": JSON.stringify(response["nsp-inventory:output"]["data"])};
    }
    logger.info(JSON.stringify(neList));
    return neList;
};

function getPorts(context) {
    args = context.getInputValues()["arguments"];
    attribute = context.getInputValues()["arguments"]["__attribute"];
    path = attribute.replace('port-id', 'ne-id').split('.');

    neId = args;
    path.forEach( function(elem) {
        neId = neId[elem];
    })

  
    logger.info("arguments: " + args );
    logger.info("attribute: " + attribute );
    logger.info("path: " + path );
    logger.info("neId: " + neId );
  
    var requestBody = {};
    requestBody["input"] = {'depth': 3, 'fields': 'name;description;port-details', 'xpath-filter': "/nsp-equipment:network/network-element/hardware-component/port"};

    if (context.getInputValues()["arguments"]["port-id"]) {
      requestBody["input"]['xpath-filter'] = "/nsp-equipment:network/network-element[ne-id='" + neId + "']/hardware-component/port[contains('name','" + context.getInputValues()["arguments"]["port-id"] + "')]";
    } else {
      requestBody["input"]['xpath-filter'] = "/nsp-equipment:network/network-element[ne-id='" + neId + "']/hardware-component/port[boolean(port-details[port-type = 'ethernet-port'])]";
    }

    restClient.setIp('nsp-mdt-nsp-mediator-svc');
    restClient.setPort(80);
    restClient.setProtocol('http');
    var response = utils.restPOST('https://restconf-gateway:443/restconf/operations/nsp-inventory:find', JSON.stringify(requestBody))
    
    var portList = {};
    if (response["nsp-inventory:output"]) {
      portList = {"data": JSON.stringify(response["nsp-inventory:output"]["data"])};
    }
    logger.info(JSON.stringify(portList));
    return portList;
};
