/**
 * The basic building block, a node, which is shared by text and shape classes, below.
 */
class CNode {
  private backgroundColor: string;
  private strokeWeight: number;
  private strokeColor: string;
  private x: number;
  private y: number;
  private scaleX: number;
  private scaleY: number;
  private id: number;

  /**
   * Creates a CNode object
   * @param backgroundColor the background color as rgb(n0, n1, n2), or hex. Unused.
   * @param strokeWeight The stroke weight for the border. Unused.
   * @param strokeColor The stroke color as rgb(n0, n1, n2), or hex. Unused.
   * @param x The x position on the canvas.
   * @param y The y position on the canvas.
   * @param id The ID, to differentiate different nodes.
   * @param scaleX The scale on the X axis.
   * @param scaleY The scale on the Y axis.
   */
  constructor(backgroundColor: string, strokeWeight: number, strokeColor: string, x: number, y: number, id: number, scaleX: number, scaleY: number) {
    this.backgroundColor = backgroundColor;
    this.strokeWeight = strokeWeight;
    this.strokeColor = strokeColor;
    this.x = x;
    this.y = y;
    this.id = id;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
  }

  // getters
  getStrokeWeight() { return this.strokeWeight; }
  getX() { return this.x; }
  getScaleX() { return this.scaleX; }
  getScaleY() { return this.scaleY; }
  getCoordinates() { return { x: this.x, y: this.y }; }
  getY() { return this.y; }
  getColor() { return this.strokeColor; }
  getBackgroundColor() { return this.backgroundColor; }
  getId() { return this.id; }

  // setters
  setCoordinates(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  setScale(scaleX: number, scaleY: number) {
    this.scaleX = scaleX;
    this.scaleY = scaleY;
  }
  setStrokeWeight(weight: number) { this.strokeWeight = weight; }
  setStrokeColor(color: string) { this.strokeColor = color; }
  setBackgroundColor(color: string) { this.backgroundColor = color; }
}

type ShapeType = 'CIRCLE' | 'RECTANGLE' | 'BUBBLE_1' | 'BUBBLE_2' | 'DIAMOND';
/**
 * The Shape class used by most shape, such as the circle, rectangle and diamond.
 */
class Shape extends CNode {
  private text: CText;
  private type: ShapeType;
  private subnodes: Shape[];
  private masterNode: Shape;

  /**
   * Creates a Shape object.
   * @param x The x position on the canvas.
   * @param y The y position on the canvas.
   * @param type The type of the Shape
   * @param id The ID, to differentiate the Shapes.
   * @param scaleX The scale on the X axis.
   * @param scaleY The scale on the Y axis.
   */
  constructor(x: number, y: number, type: ShapeType, id: number, scaleX: number, scaleY: number) {
    super('', 1, '', x, y, id, scaleX, scaleY);
    this.text = new CText(x, y, 'HEADING_1', '', id, scaleX, scaleY);  // Example initialization
    this.type = type;
    this.subnodes = [];
    this.masterNode = null;
  }

  // setters
  setText(text: string) { this.text.setText(text); }
  setType(type: ShapeType) { this.type = type; }
  setMasterNode(shape: Shape) { this.masterNode = shape; }
  clearMasterNode() { this.masterNode = null; }

  // getters
  getText() { return this.text.getText(); }
  getType(): ShapeType { return this.type; }

  addSubnode(shape: Shape) { this.subnodes.push(shape); }
  removeSubnode(id: number) {
    for (let i = 0; i < this.subnodes.length; i++) {
      const shape = this.subnodes[i];
      console.log(shape.getId(), id);
      if (shape.getId() === id) {
        this.subnodes.splice(i, 1);
        return;
      }
    }
  }
}

type TextType = 'HEADING_1' | 'BODY_1' | 'SUBHEADING_1';
/**
 * The text node.
 */
class CText extends CNode {
  private text: string;
  private type: TextType;

  /**
   * Creates a CText object
   * @param x The x position on the canvas.
   * @param y The y position on the canvas.
   * @param type The type of text. Unused.
   * @param text The text content.
   * @param id The ID used to differentiate different nodes. 
   * @param scaleX The scale on the X axis.
   * @param scaleY The scale on the Y axis.
   */
  constructor(x: number, y: number, type: TextType, text: string, id: number, scaleX: number, scaleY: number) {
    super('', 2, '', x, y, id, scaleX, scaleY);
    this.text = text;
    this.type = type;
  }

  // setters
  setText(text: string) { this.text = text; }
  setType(type: TextType) { this.type = type; }

  // getters
  getText() { return this.text; }
  getType(): TextType { return this.type; }
}
/**
 * The canvas that holds all shapes (like a worksheet on Excel).
 */
class Canvas {
  private nodes: { [key: string]: CNode };
  private name: string;

  /**
   * Craetes a Canvas object
   * @param name the name of the canvas
   */
  constructor(name: string) {
    this.nodes = {};
    this.name = name;
  }

  getNode(id: number): CNode { return this.nodes[`n${id}`]; }
  getNodes(): { [key: string]: CNode } { return this.nodes; }
  getName(): string { return this.name; }
  setName(name: string): void { this.name = name; }
  addShape(x: number, y: number, type: ShapeType, scaleX: number, scaleY: number): number {
    const id = this.generateId();
    this.nodes[`n${id}`] = new Shape(x, y, type, id, scaleX, scaleY);
    return id;
  }
  removeNode(node: CNode): void {
    for (const id in this.nodes) {
      if (this.nodes[id].getId() === node.getId()) {
        this.removeNodeById(node.getId());
      }
    }
  }
  removeNodeById(id: number): void { delete this.nodes[`n${id}`]; }
  generateId(): number {
    const max = 99999;
    const min = 10000;
    let number: number = null;
    // eslint-disable-next-line no-prototype-builtins
    while (!number || this.nodes.hasOwnProperty(number)) {
      number = Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return number;
  }
}
/**
 * The Workbook, same as an Excel workbook.
 */
class Workbook {
  save(): string {
    const canvasList: canvasData[] = [];

    for (const canvas of this.canvases) {
      const nodesData: nodesData = {};
      const nodes = canvas.getNodes();

      for (const key in nodes) {
        const node = nodes[key];

        nodesData[key] = {
          x: node.getX(),
          y: node.getY(),
          backgroundColor: node.getBackgroundColor(),
          strokeWeight: node.getStrokeWeight(),
          strokeColor: node.getColor(),
        };
      }

      canvasList.push({
        name: canvas.getName(),
        nodes: nodesData
      });
    }

    const workbook = {
      canvases: canvasList,
      name: this.name,
      savePathname: this.savePathname,
      activeCanvas: this.activeCanvas,
    }

    return JSON.stringify(workbook);
  }
  private canvases: Canvas[];
  private name: string;
  private savePathname: string;
  private activeCanvas: number;

  /**
   * Creates a Workbook object.
   * @param name the name of the workbook.
   */
  constructor(name: string) {
    this.canvases = [];
    this.savePathname = '';
    this.name = name;
    this.activeCanvas = -1;
  }

  addCanvas(): Canvas {
    const canvas = new Canvas(`Canvas ${this.canvases.length + 1}`);
    this.canvases.push(canvas);
    this.activeCanvas = this.canvases.length - 1;
    return canvas;
  }

  removeCanvas(canvas: Canvas): void {
    const index = this.canvases.indexOf(canvas);
    if (index > -1) {
      this.canvases.splice(index, 1);
    }
    this.activeCanvas = 0;
  }
  getCanvas(index: number) { return this.canvases[index]; }
  getName(): string { return this.name; }
  setName(name: string): void { this.name = name; }
  getActiveCanvas(): Canvas | null { return this.activeCanvas < 0 ? null : this.getCanvas(this.activeCanvas); }
}

/**
 * The main interface that the front-end uses to interact with the back-end.
 */
class Model {
  private activeWorkbook: Workbook;

  constructor() {
    console.log('Initting model');
  }
  /**
   * Loads a workbook from storage. Currently unimplemented, so it returns an empty workbook.
   * @param path The absolute pathname to the workbook file.
   * @returns The workbook.
   */
  loadWorkbook(path: string): Workbook | null {
    console.log("NEED A LOAD IMPLEMENTATION");
    this.activeWorkbook = new Workbook('test workbook');
    return this.activeWorkbook;
  }
  /**
   * Saves the active workbook. If it is not null
   */
  saveWorkbook() {
    if(this.activeWorkbook) this.activeWorkbook.save();
  }

  // Getters
  getActiveWorkbook(): Workbook | null { return this.activeWorkbook; }
  getActiveCanvas(): Canvas | null {
    if (!this.getActiveWorkbook()) return null;
    return this.getActiveWorkbook().getActiveCanvas();
  }
}

type canvasData = { name: string, nodes: nodesData };

type nodesData = {
  [key: string]: {
    x: number;
    y: number;
    backgroundColor: string;
    strokeWeight: number;
    strokeColor: string;
  }
};