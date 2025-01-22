#!/usr/bin/env node

const { ArgumentParser }  = require('argparse');
const { version } = require('../package.json');

const fs = require('fs');

var cytoscape = require('cytoscape');

var dagre = require('cytoscape-dagre');

cytoscape.use( dagre ); // register extension

const { CxToJs, CyNetworkUtils } = require('cytoscape-cx2js');

const parser = new ArgumentParser({
    description: "Runs Cytoscape.js layouts on the command line outputting the node positions to standard out"
});

parser.add_argument('input', {help: 'File of Network in CX format'});
parser.add_argument('--version', { action: 'version', version });
parser.add_argument('--layout', { choices: ['cose', 'grid', 'circle', 'concentric', 'breadthfirst', 'dagre'],
                                  default: 'cose',
                                  help: 'Layout algorithm to run'});
parser.add_argument('--outputcx', { action: 'store_true',
                                    help: 'Output the updated CX object with new layout coordinates'});

var args = parser.parse_args();

var layout = args.layout;

// read CX file
var content = fs.readFileSync(args.input);
var rawCX = JSON.parse(content);

// initialize cytoscapeCx2js
var utils = new CyNetworkUtils();
var niceCX = utils.rawCXtoNiceCX(rawCX);
var cx2Js = new CxToJs(utils);

// initialize cytoscape.js
var cy = cytoscape({});


// add the elements from the CX file into cytoscape.js
var eles = cy.add(cx2Js.cyElementsFromNiceCX(niceCX, {}));
var nodes = cy.filter('node');
var num_nodes = nodes.length;
var node_size = 75.0
var box_size = Math.sqrt(node_size*node_size*num_nodes);

if (box_size < 500.0){
  box_size = 500;
}

function writeAndExit(data, callback) {
  const ok = process.stdout.write(data, () => {
      // This callback is called once the write is complete
      if (callback) {
          callback();
      }
  });

  if (!ok) {
      // If the buffer is full, wait for the 'drain' event
      process.stdout.once('drain', () => {
          if (callback) {
              callback();
          }
      });
  }
}

// function called when layout completed
var ready_func = function() {
  let foundCartesianLayout = false;
  if (args.outputcx) {
      
      let cartesianLayout = [];
      for (const n of cy.json().elements.nodes) {
          cartesianLayout.push({
              node: n.data.id,
              x: n.position.x,
              y: n.position.y
          });
      }
      for (let i = rawCX.length - 1; i >= 0; i--){
        let aspectKeys = Array.from(Object.keys(rawCX[i]));
        if (aspectKeys.includes('metaData')){
          continue;
        }
        if (aspectKeys.includes('cartesianLayout')){
          rawCX[i].cartesianLayout = cartesianLayout;
          foundCartesianLayout = true;
        }
      }
      // Prepare cartesianLayout aspect
      if (foundCartesianLayout == false){
         rawCX.push(cartesianLayout);
      }
      //console.log(rawCX);
      //rawCX.cartesianLayout = cartesianayout;
      // Output updated niceCX object
      //process.stdout.write(JSON.stringify(rawCX, null, null));
      //process.stdout.write('\n');
      //process.stdout.write('\n');
      writeAndExit(JSON.stringify(rawCX, null, 2), () => {
        process.exit(0);
      });
  } else {
      var first = true;
      process.stdout.write('[\n');
      for (const n of cy.json().elements.nodes){
            if (first === true){
              first = false;
            } else {
              process.stdout.write(',\n');
            }
            writeAndExit(JSON.stringify({ node: n.data.id,
                                                x: n.position.x,
                                                y: n.position.y}) + '\n]\n', () => {
                                                  process.exit(0);
                                                });
        }

  }
    
};


// configure the layout
var layout = cy.layout({
    name: layout,
    boundingBox: { x1: 0,
                   y1: 0,
                   w: box_size,
                   h: box_size},
    ready: ready_func 

});

// run the layout
layout.run();


// denote we ran successfully
process.exitCode = 0