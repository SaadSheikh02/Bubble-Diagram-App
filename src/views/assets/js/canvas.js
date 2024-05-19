/* eslint-disable no-undef */
/**
 * Pans all objects recursively, this works if an object has subnodes.
 * @param {*} object the objects on the canvas, aka the front-end version of a CNode.
 * @param {*} mouseX The mouse x position.
 * @param {*} mouseY The mouse y position.
 */
function panRecursively(object, mouseX, mouseY) {
  if (object.offset) {
    object.x = mouseX + object.offset.x;
    object.y = mouseY + object.offset.y;
  }
  if (object.children) {
    for (let child of object.children) {
      panRecursively(child, mouseX, mouseY);
    }
  }
}

/**
 * draws the background
 * @param { boolean} drawBackground true if you would like to redraw the actual background, otherwise only draw the circles
 */
function drawBackground(stage, drawBackground) {
  const spacing = 50;
  let x0 = spacing, y0 = spacing, x1 = canvas.width, y1 = canvas.height;
  for (let c of stage.children) {
    if (c.name === 'background') {
      x0 = c.x;
      y0 = c.y;
      x1 += x0;
      y1 += y0;
      stage.removeChild(c);
      break;
    }
  }
  const background = new createjs.Shape();
  background.name = 'background';
  background.graphics.setStrokeStyle(1);
  for (let i = x0; i < x1; i += spacing) {
    for (let j = y0; j < y1; j += spacing) {
      background.graphics.beginStroke('hsla(0, 0%, 90%, 0.5)');
      background.graphics.drawCircle(i, j, 2);
      background.graphics.endStroke();
    }
  }
  background.graphics.moveTo(x0, y0);
  background.graphics.beginFill('hsla(0, 0%, 0%, 0.01)');
  background.graphics
    .lineTo(x1, y0)
    .lineTo(x1, y1)
    .lineTo(x0, y1)
    .lineTo(x0, y0)

  stage.addChild(background);
  stage.background = background;


  background.on('mousedown', () => {
    deleteCaret(focusedNode);
    focusedNode = null;
    deleteAllOutlines();
  });
}
/**
 * Scales the canvas. This is run when user resizes the window.
 * @param {*} canvas the canvas object
 * @param {*} stage the stage object
 */
function scaleCanvas(canvas, stage) {
  canvas.removeAttribute('width');
  canvas.removeAttribute('height');
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
  drawBackground(stage, true);

  update = true;
}


this.document.onkeydown = (evt) => {
  if (focusedNode && focusedNode.text) {
    let textNode = focusedNode.text;
    let prevLength = textNode.text.length;
    switch (evt.key) {
      case 'ArrowLeft':
        textNode.caretPosition = Math.max(textNode.caretPosition - 1, 0);
        break;
      case 'ArrowRight':
        textNode.caretPosition = Math.min(textNode.caretPosition + 1, textNode.text.length);
        break;
      case 'Home':
        textNode.caretPosition = 0;
        break;
      case 'End':
        textNode.caretPosition = textNode.text.length;
        break;
      case 'Backspace':
        textNode.text = textNode.text.substring(0, textNode.caretPosition - 1) + textNode.text.substring(textNode.caretPosition, textNode.text.length);
        if (textNode.text.length !== prevLength)
          textNode.caretPosition = Math.max(textNode.caretPosition - 1, 0);
        break;
      case 'Delete':
        textNode.text = textNode.text.substring(0, textNode.caretPosition) + textNode.text.substring(textNode.caretPosition + 1, textNode.text.length);
        if (textNode.text.length !== prevLength)
          textNode.caretPosition = Math.max(textNode.caretPosition, 0);
        break;
    }
    if (evt.key.length === 1) {
      textNode.text = textNode.text.substring(0, textNode.caretPosition) + evt.key
      textNode.text.substring(textNode.caretPosition, textNode.text.length);
      textNode.caretPosition++;
    }
    model.getActiveCanvas().getNode(focusedNode.id).setText(textNode.text);
    redrawCaret(focusedNode);
    update = true;
    return;
  }
}

/**
 * Document wide event listeners, used to delete nodes on button click.
 */
this.document.onkeyup = (evt) => {
  if (focusedNode) return;
  if(evt.key === 'Delete' || evt.key === 'Backspace') {
    let selectedNodes = getSelectedNodes();
    if (selectedNodes.length == 0) return;

    for (let node of selectedNodes) {
      // ew
      node.parent.parent.removeChild(node.parent);
      model.getActiveCanvas().removeNodeById(node.id);

    }
    update = true;

  }
}