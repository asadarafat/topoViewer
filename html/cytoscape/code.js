/* global Promise, fetch, window, cytoscape, document, tippy, _ */


Promise.all([
  fetch('cy-style.json')
    .then(function(res) {
      return res.json();
    }),
  fetch('data-cytoMarshall.json')
    .then(function(res) {
      // console.log(res)
      return res.json();
    })
    
])
  .then(function(dataArray) {
    
    //server URL
    var serverUrl = location.protocol + '//' + location.host;
    console.log(serverUrl);

    var h = function(tag, attrs, children){
      var el = document.createElement(tag);

      Object.keys(attrs).forEach(function(key){
        var val = attrs[key];

        el.setAttribute(key, val);
      });

      children.forEach(function(child){
        el.appendChild(child);
      });
      // console.log(el)
      return el;
    };

    var t = function(text){
      var el = document.createTextNode(text);
      // console.log(el)
      return el;
    };

    var $ = document.querySelector.bind(document);

    var cy = window.cy = cytoscape({
      container: document.getElementById('cy'),
      style: dataArray[0],
      elements: dataArray[1],
      layout: { name: 'random' }
    });

    var params = {
      name: 'cola',
      nodeSpacing: 5,
      nodeSpacingAsad: 10,
      edgeLengthVal: 45,
      animate: true,
      randomize: false,
      maxSimulationTime: 1500
    };
    var layout = makeLayout();

    layout.run();

    var $btnParam = h('div', {
      'class': 'param'
    }, []);

    var $config = $('#config');

    $config.appendChild( $btnParam );


    var sliders = [
      {
        label: 'Edge length',
        param: 'edgeLengthVal',
        min: 1,
        max: 200
      },

      {
        label: 'Node spacing',
        param: 'nodeSpacing',
        min: 1,
        max: 50
      },

      {
        label: 'Placeholder',
        param: 'Placeholder',
        min: 1,
        max: 500
      }
    ];

    var buttons = [
      {
        label: h('span', { 'class': 'fa fa-random' }, []),
        layoutOpts: {
          randomize: true,
          flow: null
        }
      },

      {
        label: h('span', { 'class': 'fa fa-long-arrow-down' }, []),
        layoutOpts: {
          flow: { axis: 'y', minSeparation: 30 }
        }
      }
    ];

    // button for BgpLU link
    var buttonsBgpLuLink = [
      {
        label: h('span', { 'class': 'fa fa-check-square' }, []),
        layoutOpts: {
          flow: { axis: 'y', minSeparation: 30 }
        }
      }
    ];


    sliders.forEach( makeSlider );
    buttons.forEach( makeButton );
    buttonsBgpLuLink.forEach(makeButtonBgpLuLink);


    function makeLayout( opts ){
      params.randomize = false;
      params.edgeLength = function(e){ return params.edgeLengthVal / e.data('weight'); };

      for( var i in opts ){
        params[i] = opts[i];
      }

      return cy.layout( params );
    }

    function makeSlider( opts ){
      var $input = h('input', {
        id: 'slider-'+opts.param,
        type: 'range',
        min: opts.min,
        max: opts.max,
        step: 1,
        value: params[ opts.param ],
        'class': 'slider'
      }, []);

      var $param = h('div', { 'class': 'param' }, []);

      var $label = h('label', { 'class': 'label label-default', for: 'slider-'+opts.param }, [ t(opts.label) ]);

      $param.appendChild( $label );
      $param.appendChild( $input );

      $config.appendChild( $param );

      var update = _.throttle(function(){
        params[ opts.param ] = $input.value;

        layout.stop();
        layout = makeLayout();
        layout.run();
      }, 1000/30);

      $input.addEventListener('input', update);
      $input.addEventListener('change', update);
    }

    function makeButton( opts ){
      var $button = h('button', { 'class': 'btn btn-default' , 'title': "Auto Layout"}, [ opts.label ]);

      $btnParam.appendChild( $button );

      $button.addEventListener('click', function(){
        layout.stop();

        if( opts.fn ){ opts.fn(); }

        layout = makeLayout( opts.layoutOpts );
        layout.run();
      });
    }


    bgpLuLink = cy.filter ('edge[group = "bgpLu"]');
    //var bgpLuLink = cy.edges();
    console.log('bgpLuLink'); 
    console.log(bgpLuLink); 

    var bgpLuLinkVisibiliy = true

    function makeButtonBgpLuLink( opts ){
      var $buttonsBgpLuLink = h('button', { 'class': 'btn btn-default' , 'title': "Toggle show BGP-LU Link-Tunnel" }, [ opts.label ]);
      $btnParam.appendChild( $buttonsBgpLuLink );
      $buttonsBgpLuLink.addEventListener('click', function(){
        layout.stop();
        
        if (bgpLuLinkVisibiliy){
          bgpLuLink.remove()
          bgpLuLinkVisibiliy = false
          console.log('bgpLuLinkVisibiliy: ' + bgpLuLinkVisibiliy);
        }
        else {
          bgpLuLink.restore()
          bgpLuLinkVisibiliy = true
          console.log('bgpLuLinkVisibiliy: ' + bgpLuLinkVisibiliy);
        }
        
      });
    }

    var makeTippy = function(elementEdgeNode, html){
      return tippy( elementEdgeNode.popperRef(), {
        html: html,
        trigger: 'manual',
        arrow: 'Round',
        placement: 'right-end',
        hideOnClick: false,
        interactive: true
      } ).tooltips[0];
    };

    var hideTippy = function(elementEdgeNode){
      var tippy = elementEdgeNode.data('tippy');
      if(tippy != null){
        tippy.hide();
      }
    };
    

    var hideAllTippies = function(){
      cy.nodes().forEach(hideTippy);
    };

    var hideAllTippiesEdges = function(){
      cy.edges().forEach(hideTippy);
    };

    cy.on('tap', function(e){
      if(e.target === cy){
        hideAllTippies();
        hideAllTippiesEdges();
      }
    });

    cy.on('tap', 'edge', function(e){
      hideAllTippies();
    });

    cy.on('zoom pan', function(e){
      hideAllTippies();
    });

    cy.nodes().forEach(function(n){
      var g = n.data('name');
      // console.log(n)
      // console.log(n.data('name'))
      // console.log(n.jsons())
      // console.log(n.data('ExtraData').MgmtIPv4Address)


      var $links = [
        {
          name: 'Open SSH Session',
          url: serverUrl+'/cloudshell/?RouterID='+n.data('ExtraData').MgmtIPv4Address
        },
        {
          name:  'Node Kind: ' + n.data('ExtraData').Kind
          // url: 'http://www.uniprot.org/uniprot/?query='+ g +'&fil=organism%3A%22Homo+sapiens+%28Human%29+%5B9606%5D%22&sort=score'
        }
      ].map(function( link ){
        return h('a', { target: '_blank', href: link.url, 'class': 'tip-link' }, [ t(link.name) ]);
      });


      var tippy = makeTippy(n, h('div', {}, $links));
      n.data('tippy', tippy);
      n.on('click', function(e){
        tippy.show();
        cy.nodes().not(n).forEach(hideTippy);
        cy.edges().not(n).forEach(hideTippy);

      });
    });


    
    cy.edges().forEach(function(n){
      var g = n.data('name');
      // console.log(n)
      // console.log(n.data('name'))
      // console.log(n.jsons())
      // console.log(n.data('ExtraData').MgmtIPv4Address)
      var $links = [
        {
          name: 'Add Link Latency',
          url: 'ssh://admin@' + n.data('ExtraData').MgmtIPv4Address
        },
        {
          name: 'WireShark Capture Endpoint-A: '+n.data('ExtraData').sourceLongName+'--'+n.data('ExtraData').endpoint.SourceEndpoint,
          url: 'clab-capture://suuser'+'@'+location.host+'?'+n.data('ExtraData').sourceLongName+'?'+n.data('ExtraData').endpoint.SourceEndpoint
        },
        {
          name: 'WireShark Capture Endpoint-B: '+n.data('ExtraData').targetLongName+'--'+n.data('ExtraData').endpoint.TargetEndpoint,
          url: 'clab-capture://suuser'+'@'+location.host+'?'+n.data('ExtraData').targetLongName+'?'+n.data('ExtraData').endpoint.TargetEndpoint
        },
        {
          name:  'Link Type: ' + n.data('routerType'),
          url: 'http://www.uniprot.org/uniprot/?query='+ g +'&fil=organism%3A%22Homo+sapiens+%28Human%29+%5B9606%5D%22&sort=score'
        }
      ].map(function( link ){
        return h('a', { target: '_blank', href: link.url, 'class': 'tip-link' }, [ t(link.name) ]);
      });

      var tippy = makeTippy(n, h('div', {}, $links));
      n.data('tippy', tippy);
      n.on('click', function(e){
        tippy.show();
        cy.edges().not(n).forEach(hideTippy);
        cy.nodes().not(n).forEach(hideTippy);
      });
    });



    $('#config-toggle').addEventListener('click', function(){
      $('body').classList.toggle('config-closed');

      cy.resize();
    });

  });
