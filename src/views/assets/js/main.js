/* eslint-disable no-undef */
const DEBUG = false;
let stage;
const canvas = document.querySelector('canvas');
let update = true;
let mouseTarget;	// the display object currently under the mouse, or being dragged
let dragStarted;	// indicates whether we are currently in a drag operation
let offset;
let focusedNode = null;
let model;
const init = () => {
  stage = new createjs.Stage(canvas);
  model = new Model();
  console.log('temp code remove from main.js:14');
  model.loadWorkbook().addCanvas();
  
  // TODO: Update WORKBOOK_NAME

  // Hook event listeners
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const nodes = [...document.querySelectorAll('.node')];
  for (const node of nodes) {
    node.addEventListener('mousedown', () => {
      const nodeType = node.id;
      // console.log(`mousedown on ${nodeType}`);
      mouseTarget = nodeType;
    });
    node.addEventListener('mousemove', () => {
      const nodeType = node.id;
      // console.log(`mousemove on ${nodeType}`);
      dragStarted = true;
    });
    node.addEventListener('mouseup', () => {
      const nodeType = node.id;
      // console.log(`mouseup on ${nodeType}`);
      var image = new Image();
      image.src = `assets/img/nodes/${nodeType}.png`;
      image.onload = handleImageLoad;
      mouseTarget = null;
      dragStarted = false;
    });
    window.addEventListener('resize', () => { scaleCanvas(canvas, stage); });
    scaleCanvas(canvas, stage);
  }

  // enabled mouse over / out events
  stage.addEventListener('pressmove', (evt) => {
    if(evt.nativeEvent.buttons === 4)  {
      // does not work yet.
      // panRecursively(stage, evt.stageX, evt.stageY);
      // drawBackground(stage, false);
      console.log('panning');
      update = true;
    }
  })
  stage.addEventListener('stagemousedown', (evt) => {
    if(evt.nativeEvent.buttons === 4)  {
      setOffsetRecursively(evt, stage);
    }
  })
  createjs.Touch.enable(stage);
  stage.enableMouseOver(10);
  stage.mouseMoveOutside = true; // keep tracking the mouse even when it leaves the canvas
  createjs.Ticker.timingMode = createjs.Ticker.RAF;
  createjs.Ticker.addEventListener('tick', tick);
}

function setOffsetRecursively(evt, object) {
  object.offset = { x: object.x - evt.stageX, y: object.y - evt.stageY }; // offset from original position is defined here
  if(object.children) {
    for(let child of object.children) {
      setOffsetRecursively(evt, child);
    }
  }
}



function stop() {
  createjs.Ticker.removeEventListener('tick', tick);
}
/**
 * Handles adding shapes to the canvas
 * @param {*} event event data taken from the event listener
 */
function handleImageLoad(event) {
  var image = event.target;
  var bitmap;
  const container = new createjs.Container();
  container.subnodes = [];
  stage.addChild(container);
  bitmap = new createjs.Bitmap(image);
  container.addChild(bitmap);
  container.bitmap = bitmap;
  bitmap.x = canvas.width / 2;
  bitmap.y = canvas.height / 2;
  bitmap.rotation = 0;
  bitmap.regX = bitmap.image.width / 2 | 0;
  bitmap.regY = bitmap.image.height / 2 | 0;
  bitmap.scale = .25;
  bitmap.originalScale = bitmap.scale;
  bitmap.name = 'mainShape';
  bitmap.cursor = 'grab';
  // update model
  bitmap.id = model.getActiveCanvas().addShape(bitmap.x, bitmap.y, image.id, bitmap.scaleX, bitmap.scaleY);

  // using 'on' binds the listener to the scope of the currentTarget by default
  // in this case that means it executes in the scope of the button.
  bitmap.on('mousedown', function (evt) {
    this.parent.addChild(this);
    mousedownBitmap(this, evt);
    // display scale rectangle
    deleteAllOutlines();
    drawOutline(this);
    update = true;
  });

  // the pressmove event is dispatched when the mouse moves after a mousedown on the target until the mouse is released.
  bitmap.on('pressmove', function (evt) {
    // console.log(`this.x: ${this.x}, stageX: ${evt.stageX}, offsetX: ${this.offset.x}`);
    // console.log(`this.y: ${this.y}, stageY: ${evt.stageY}, offsetY: ${this.offset.y}`);
    moveBitmap(this, evt);
    drawOutline(this);
    if(focusedNode)
      redrawCaret(this);


    // bind stuff
    deleteAllBindOutlines();
    let x = evt.rawX, y = evt.rawY;
    let nodes = getNeighboringNodes(x, y);
    if(nodes.length > 0) {
      drawBindOutline(nodes[0]);
    }
    // indicate that the stage should be updated on the next tick:
    update = true;
  });
  bitmap.on('pressup', function(evt) {
    let x = evt.rawX, y = evt.rawY;
    let nodes = getNeighboringNodes(x, y);
    if(nodes.length > 0) {
      // closest neighboring node
      if(!this.parent.masterNode ||
        (nodes[0].parent.masterNode && nodes[0].parent.masterNode.bitmap.id === this.id)) {
          nodes[0].parent.subnodes.push(this.parent);
          this.parent.masterNode = nodes[0].parent;
          console.log(nodes[0]);
          // update model
          let canvas = model.getActiveCanvas();
          let thisNode = canvas.getNode(this.id);
          let masterNode = canvas.getNode(nodes[0].id);
          masterNode.addSubnode(thisNode);
          thisNode.setMasterNode(masterNode);
      }
    } else if(this.parent.masterNode) {
      // remove binding
      let subnodes = this.parent.masterNode.subnodes;
      subnodes.splice(subnodes.indexOf(this.parent));
      // update model
      let canvas = model.getActiveCanvas();
      let masterNode = canvas.getNode(this.parent.masterNode.bitmap.id);
      masterNode.removeSubnode(this.id);
      canvas.getNode(this.id).clearMasterNode();

      // nullify masterNode
      this.parent.masterNode = null;
    }
    deleteAllBindOutlines();
    update = true;
  })
  container.on('dblclick', function (evt) {
    if (!evt.target.text) {
      console.log(evt);
      const text = new createjs.Text("", "20px Roboto Mono", "white");
      text.textAlign = 'center';
      text.textBaseline = "alphabetic";
      text.x = evt.target.x;
      text.y = evt.target.y;
      text.maxWidth = evt.target.width * evt.target.scaleX;
      console.log(text.x, text.y);
      evt.target.parent.addChild(text);
      evt.target.text = text;
    
    }
    deleteCaret(focusedNode);
    focusedNode = evt.target;
    focusedNode.text.caretPosition = evt.target.text.text.length;
    redrawCaret(focusedNode);
  });

  update = true;
}
function tick(event) {
  // this set makes it so the stage only re-renders when an event handler indicates a change has happened.
  if (update) {
    update = false; // only update once
    stage.update(event);
  }
}

/**
 * Handles mousedown on a shape. Propagates this function to subnodes.
 * @param {*} bitmap the bitmap
 * @param {*} evt the event taken from the event listener.
 */
function mousedownBitmap(bitmap, evt) {
  bitmap.offset = { x: bitmap.x - evt.stageX, y: bitmap.y - evt.stageY }; // offset from original position is defined here
  if(bitmap.text) {
    bitmap.text.offset = { x: bitmap.text.x - evt.stageX, y: bitmap.text.y - evt.stageY }; // offset from original position is defined here
  }
  for(let node of bitmap.parent.subnodes) {
    mousedownBitmap(node.bitmap, evt);
  }
}
/**
 * Handles moving a shape. Propagates this function to subnodes.
 * @param {*} bitmap the bitmap
 * @param {*} evt the event taken from the event listener.
 */
function moveBitmap(bitmap, evt) {
  bitmap.x = evt.stageX + bitmap.offset.x; // x-value of the offset applied to the original position of the object
  bitmap.y = evt.stageY + bitmap.offset.y; // y-value of the offset applied to the original position of the object
  model.getActiveCanvas().getNode(bitmap.id).setCoordinates(bitmap.x, bitmap.y);
  if (bitmap.text) {
    bitmap.text.x = evt.stageX + bitmap.text.offset.x;
    bitmap.text.y = evt.stageY + bitmap.text.offset.y;
  }
  for(let node of bitmap.parent.subnodes) {
    moveBitmap(node.bitmap, evt);
  }
}
/**
 * Draws a box to hint a bind action to the user
 * @param {*} bitmap the bitmap
 */
function drawBindOutline(bitmap) {
  const padding = 20;
  deleteOutline(bitmap);
  let outline = new createjs.Shape();
  outline.graphics.beginStroke('hsl(20, 100%, 60%)');
  outline.graphics.setStrokeStyle(1);
  // console.log(bitmap);
  const actualWidth = bitmap.image.width * bitmap.scaleX;
  const actualHeight = bitmap.image.height * bitmap.scaleY;
  // bitmap.x - (actualWidth / 2) because bitmap.x is at the center instead of the top left corner.
  let x0 = bitmap.x - (actualWidth / 2) - padding;
  let y0 = bitmap.y - (actualHeight / 2) - padding;
  let x1 = bitmap.x + (actualWidth / 2) + padding;
  let y1 = bitmap.y + (actualHeight / 2) + padding;
  // console.log(`x0:  ${x0}, x1:  ${x1}, y0:  ${y0}, y1:  ${y1}`);
  outline.graphics
  .moveTo(x0, y0).lineTo(x1, y0).lineTo(x1, y1).lineTo(x0, y1).lineTo(x0, y0);
  bitmap.bindOutline = outline;
  bitmap.parent.addChild(outline);
}
/**
 * Deletes all bind outlines.
 */
function deleteAllBindOutlines() {
  for(let n of getNodes()) {
    if(n.bindOutline)
      n.parent.removeChild(n.bindOutline);
  }
}
/**
 * Draws a general outline when selecting a shape on the canvas.
 * @param {*} bitmap the bitmap
 */
function drawOutline(bitmap) {
  const padding = 5;
  deleteOutline(bitmap);
  let outline = new createjs.Shape();
  outline.graphics.beginStroke('hsl(200, 80%, 60%)');
  outline.graphics.setStrokeStyle(2);
  // console.log(bitmap);
  const actualWidth = bitmap.image.width * bitmap.scaleX;
  const actualHeight = bitmap.image.height * bitmap.scaleY;
  // bitmap.x - (actualWidth / 2) because bitmap.x is at the center instead of the top left corner.
  let x0 = bitmap.x - (actualWidth / 2) - padding;
  let y0 = bitmap.y - (actualHeight / 2) - padding;
  let x1 = bitmap.x + (actualWidth / 2) + padding;
  let y1 = bitmap.y + (actualHeight / 2) + padding;
  // console.log(`x0:  ${x0}, x1:  ${x1}, y0:  ${y0}, y1:  ${y1}`);
  outline.graphics.setStrokeDash([5, 5], 0);
  outline.graphics
  .moveTo(x0, y0).lineTo(x1, y0).lineTo(x1, y1).lineTo(x0, y1).lineTo(x0, y0);
  bitmap.outline = {
    border: outline
  };
  const circlePoints = [
    { cursor: 'nw-resize', name: 'top-left', x0: x0, y0: y0 }, // top left
    { cursor: 'n-resize', name: 'top-center', x0: (x1 - x0) / 2 + x0, y0: y0 }, // top center
    { cursor: 'ne-resize', name: 'top-right', x0: x1, y0: y0 }, // top right
    { cursor: 'e-resize', name: 'right-center', x0: x1, y0: (y1 - y0) / 2 + y0 }, // right center
    { cursor: 'nw-resize', name: 'bottom-right', x0: x1, y0: y1 }, // bottom right
    { cursor: 'n-resize', name: 'bottom-center', x0: (x1 - x0) / 2 + x0, y0: y1 }, // bottom center
    { cursor: 'ne-resize', name: 'bottom-left', x0: x0, y0: y1 }, //  bottom left
    { cursor: 'e-resize', name: 'left-center', x0: x0, y0: (y1 - y0) / 2 + y0 }, // left center
  ]

  for(let p of circlePoints) {
    let shape = new createjs.Shape();
    outline.graphics.setStrokeStyle(4);
    outline.graphics.beginStroke('hsl(200, 80%, 60%)');
    shape.graphics.beginFill('hsl(200, 80%, 50%)');
    shape.graphics.drawCircle(p.x0, p.y0, 5);
    shape.name = p.name;
    shape.cursor = p.cursor;
    shape.mainShape = bitmap;
    bitmap.outline[p.name] = shape;
    shape.on('pressmove', function (evt) {
      // console.log(`this.x: ${this.x}, stageX: ${evt.stageX}, offsetX: ${this.offset.x}`);
      let mainShape = evt.target.mainShape;
      let scaleX = mainShape.scaleX;
      let scaleY = mainShape.scaleY;
      let x = evt.target.name.includes('right') ? 
        mainShape.x - (mainShape.image.width / 2) * scaleX :
        evt.target.name.includes('left') ? 
        mainShape.x + (mainShape.image.width / 2) * scaleX :
        mainShape.x;
      let y = evt.target.name.includes('bottom') ? 
        mainShape.y - (mainShape.image.height / 2) * scaleY :
        evt.target.name.includes('top') ? 
        mainShape.y + (mainShape.image.height / 2) * scaleY :
        mainShape.y;

      if (evt.target.name.includes('left')) {
        mainShape.scaleX = (x - 5 - evt.stageX) / mainShape.image.width;
      } else if (evt.target.name.includes('right')) {
        mainShape.scaleX = (evt.stageX - 5 - x) / mainShape.image.width;
      }
      if (evt.target.name.includes('top')) { 
        mainShape.scaleY = (y - 5 - evt.stageY) / mainShape.image.height;
      } else if (evt.target.name.includes('bottom')) {
        mainShape.scaleY = (evt.stageY - 5 - y) / mainShape.image.height;
      }

      model.getActiveCanvas().getNode(mainShape.id).setScale(mainShape.scaleX, mainShape.scaleY);
      
      // mainShape.scale = (mousePos - 5 - cornerPos) / shapeSize;
      if(DEBUG) {
        console.log(`stageX: ${evt.stageX}, x: ${x}, scale: ${mainShape.scale}
        stageY: ${evt.stageY}, y: ${y}, name: ${evt.target.name}`);
        // console.log(model.getActiveCanvas().getNode(mainShape.id));
      }
      
      drawOutline(mainShape);
      if(mainShape.outline && DEBUG) {
        mainShape.outline.debug = new createjs.Shape();
        mainShape.outline.debug.graphics.setStrokeStyle(4);
        mainShape.outline.debug.graphics.beginStroke('red');
        mainShape.outline.debug.graphics.drawCircle(x, y, 5);
        mainShape.outline.debug.graphics.beginStroke('green');
        mainShape.outline.debug.graphics.drawCircle(mainShape.x, mainShape.y, 5);
        mainShape.parent.addChild(mainShape.outline.debug);
      }
      // indicate that the stage should be updated on the next tick:
      update = true;
    });
  }
  for(let shape in bitmap.outline) {
    bitmap.parent.addChild(bitmap.outline[shape]);
  }
}
/**
 * Deletes all outlines
 */
function deleteAllOutlines() {
  for(let node of getSelectedNodes())
    deleteOutline(node);
}
/**
 * Delets the outline for a specific bitmap
 * @param {*} bitmap the bitmap.
 */
function deleteOutline(bitmap) {
  if(bitmap.outline) {
    for(let shape in bitmap.outline) {
      if(bitmap.outline[shape].parent)
        bitmap.outline[shape].parent.removeChild(bitmap.outline[shape]);
    }
    bitmap.outline = undefined;
    update = true;
  }
}



/**
 * Gets all the selected nodes
 * @returns mainShape nodes, aka bitmaps and texts
 */
function getSelectedNodes() {
  return getNodes().filter(n => n.outline);
}
/**
 * Finds all nodes on canvas.
 * @returns the nodes
 */
function getNodes() {
  let nodes = [];
  for(let child of stage.children) {
    if(child.children) {
      for(let c of child.children) {
        if(c.name && c.name.includes('mainShape')) {
          nodes.push(c);
        }
      }
    }
  }
  return nodes;
}


/**
 * Gets an array of neighboring nodes to an (x, y)
 * @param {*} x x position
 * @param {*} y y position
 * @returns an array of all neighboring nodes
 */
function getNeighboringNodes(x, y) {
  return getNodes().filter(n => {
    const padding = 20;
    const actualWidth = n.image.width * n.scaleX;
    const actualHeight = n.image.height * n.scaleY;
    let x0 = n.x - (actualWidth / 2) - padding;
    let y0 = n.y - (actualHeight / 2) - padding;
    let x1 = n.x + (actualWidth / 2) + padding;
    let y1 = n.y + (actualHeight / 2) + padding;
    if(!n.outline) {
      // console.log(`x: ${x}, y: ${y}. {x0: ${x0}, x1: ${x1}, y0: ${y0}, y1: ${y1}}. ${!n.outline && x >= x0 && x <= x1 && y >= y0 && y <= y1}`);
    }
    return !n.outline && x >= x0 && x <= x1 && y >= y0 && y <= y1;
  })
}

/**
 * Draws a caret for text editing
 * @param {*} node the node to draw a caret in
 */
function redrawCaret(node) {
  deleteCaret(node);
  let caret = new createjs.Shape();
  caret.graphics.setStrokeStyle(1);
  caret.graphics.beginStroke('hsla(200, 80%, 60%, 0.5)');
  caret.graphics.beginFill('hsla(200, 80%, 50%, 0.25)');
  const charWidth = 12;
  console.log(node.text.caretPosition);
  x0 = node.text.x - (charWidth * (node.text.text.length/2 - node.text.caretPosition));
  y0 = node.text.y - 20;
  x1 = x0 + 2;
  y1 = y0 + 30;
  caret.graphics.moveTo(x0, y0).lineTo(x1, y0).lineTo(x1, y1).lineTo(x0, y1).lineTo(x0, y0);



  node.caret = caret;
  node.parent.addChild(caret);
  update = true;
}
/**
 * Deletes the caret. Happens when deselecting the previously active node.
 * @param {*} node the node to delete the caret from
 */
function deleteCaret(node) {
  if(node && node.caret && node.caret.parent) {
    node.caret.parent.removeChild(node.caret);
  }
}