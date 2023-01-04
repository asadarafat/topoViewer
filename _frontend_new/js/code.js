// settings object
let settings = document.getElementById("settings");
let options = document.getElementById("options");

const close = document.querySelectorAll(".close");
close.forEach(e => e.addEventListener('click', event => {
  var c = settings.className;
  if(c.includes("is-hidden")) {
    settings.className = "message";
  } else {
    settings.className = "message is-hidden";
  }
}));

// slider object
var edgeLength = document.getElementById("edgeLength");
var nodeSpacing = document.getElementById("nodeSpacing");

// create html element
function ce(tag, attrs, children) {
  var el = document.createElement(tag);
  Object.keys(attrs).forEach(function(key){
    var val = attrs[key];
    el.setAttribute(key, val);
  });
  children.forEach(function(child){
    el.appendChild(child);
  });
  return el;
};

// create text node
function ctn(text) {
  var el = document.createTextNode(text);
  return el;
};

// return node info on click
function nodeInfo(e) {
  var shellUrl = location.protocol + "//" + location.host + "/cloudshell/?RouterID=";
  var elements = [
    {
      name: "SSH Session",
      url: shellUrl + e.data("ExtraData").MgmtIPv4Address
    }
  ].map(function(link) {
    return ce("a", {target: "_blank", href: link.url, class: "button is-link"}, [ctn(link.name)] );
  });
  return ce("div", {class: "has-text-right"}, elements);
}

// return link info on click
function linkInfo(e) {
  var elements = [
    {
      name: e.data("source") + "::" + e.data("endpoint").sourceEndpoint,
      url: "clab-capture://" + e.data("ExtraData").ClabServerUsername + "@" + location.host + "?" + e.data("ExtraData").SourceLongName + "?" + e.data("ExtraData").Endpoints.SourceEndpoint
    },
    {
      name: e.data("target") + "::" + e.data("endpoint").targetEndpoint,
      url: "clab-capture://" + e.data("ExtraData").ClabServerUsername + "@" + location.host + "?" + e.data("ExtraData").TargetLongName + "?" + e.data("ExtraData").Endpoints.TargetEndpoint
    }
  ].map(function(link) {
    return ce("a", {target: "_blank", href: link.url, class: "button"}, [ctn(link.name)] );
  });

  var t1 = ce("label", {class: "label has-text-weight-semibold"}, [ctn("Wireshark Endpoints")]);
  var t2 = ce("div", {class: "buttons"}, elements);
  var t3 = ce("div", {class: "control"}, [t1, t2]);
  var wireshark = ce("div", {class: "field"}, [t3]);

  t1 = ce("label", {class: "label has-text-weight-semibold"}, [ctn("Link Latency")]);
  t2 = ce("input", {class: "input", type: "number", placeholder: "Delay (ms)", id: "delay"}, []);
  t3 = ce("div", {class: "control"}, [t2]);
  var delay = ce("div", {class: "field"}, [t1, t3]);

  t1 = ce("input", {class: "input", type: "number", placeholder: "Jitter (ms)", id: "jitter"}, []);
  t2 = ce("div", {class: "control"}, [t1]);
  var jitter = ce("div", {class: "field"}, [t2]);

  t1 = ce("input", {class: "input", type: "number", placeholder: "Rate (Kbps)", id: "rate"}, []);
  t2 = ce("div", {class: "control"}, [t1]);
  var rate = ce("div", {class: "field"}, [t2]);

  t1 = ce("input", {class: "input", type: "number", placeholder: "Loss (%)", id: "loss"}, []);
  t2 = ce("div", {class: "control"}, [t1]);
  var loss = ce("div", {class: "field"}, [t2]);

  t1 = ce("input", {class: "input", type: "number", placeholder: "Duration (secs)", id: "duration"}, []);
  t2 = ce("div", {class: "control"}, [t1]);
  var duration = ce("div", {class: "field"}, [t2]);

  // update onclick tag
  t1 = ce("a", {class: "button is-link", onclick: ""}, [ctn("Submit")]);
  t2 = ce("div", {class: "control has-text-right"}, [t1]);
  var submit = ce("div", {class: "field"}, [t2]);

  return ce("div", {}, [wireshark, delay, jitter, rate, loss, duration, submit]);
}

// remove last child
function removeLastChild() {
  var lastChild = settings.lastChild;
  if(lastChild.className == "message-body") {
    settings.removeChild(lastChild);
  }
}

// proceed to main only if two files exist
Promise.all([
  fetch("resources/cy-style.json")
    .then(function (res) {
      return res.json();
    }),
  fetch("resources/data.json")
    .then(function (res) {
      return res.json();
    })
])
.then(function(dataArray) {
  // cy defintion
  var cy = window.cy = cytoscape({
    container: document.getElementById("cy"),
    style: dataArray[0],
    elements: dataArray[1],
    layout: { name: "random" }
  });
  
  // slider change event
  var slider = function(e) {
    var layout = cy.layout({
      fit: true,
      name: "cola",
      animate: true, 
      randomize: false, 
      maxSimulationTime: 1500,
      edgeLength: function(e) {
        return edgeLength.value / e.data("weight"); 
      },
      nodeSpacing: nodeSpacing.value
    });
    layout.run();
  }

  var addSliderEvent = function(e) {
    e.addEventListener("input", slider);
    e.addEventListener("change", slider);
  }
  addSliderEvent(edgeLength);
  addSliderEvent(nodeSpacing);

  // trigger info panel on node click
  cy.nodes().forEach(function(node) {
    node.on("click", function(e) {
      removeLastChild();
      var t1 = ce("b", {}, [ctn("Node: ")]);  
      var name = ce("p", {}, [t1, ctn(node.data("name"))]);
      var t2 = ce("b", {}, [ctn("Kind: ")]);
      var kind = ce("p", {}, [t2, ctn(node.data("ExtraData").Kind)]);
      var seperator = ce("hr", {class: "my-3 has-background-grey-lighter"}, []);
      var addon = ce("div", {}, [nodeInfo(node)]);
      var panel = ce("div", {}, [name, kind, seperator, addon]);
      var messageBody = ce("div", {class: "message-body"}, [panel])
      settings.appendChild(messageBody);
      settings.className = "message";
    });
  });

  // trigger info panel on edge or link click
  cy.edges().forEach(function(edge) {
    edge.on("click", function(e) {
      removeLastChild();
      var t1 = ce("b", {}, [ctn("Link: ")]);  
      var name = ce("p", {}, [t1, ctn(edge.data("name"))]);
      var seperator = ce("hr", {class: "my-3 has-background-grey-lighter"}, []);
      var addon = ce("div", {}, [linkInfo(edge)]);
      var panel = ce("div", {}, [name, seperator, addon]);
      var messageBody = ce("div", {class: "message-body"}, [panel])
      settings.appendChild(messageBody);
      settings.className = "message";
    });
  });

  // remove info panel on node or edge unselect
  cy.on("tap", function(e) {
    if(e.target === cy ){
      settings.className = "message is-hidden";
      removeLastChild();
    }
  });
});