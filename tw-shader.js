// Name: Re:Canvas
// ID: DJYReCanvas
// Description: Re:Canvas,an advanced pen extension can be used in turbowarp.
// By:_DestrainJurY_ <https://space.bilibili.com/302475547>
(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    throw new Error('Re:Canvas must be run unsandboxed');
  }

  const vm = Scratch.vm;
  const renderer = vm.renderer;
  const gl = renderer.gl;

  const Skin = renderer.exports.Skin;
  const twgl = renderer.exports.twgl;

  const CUSTOM_STATE_KEY = Symbol();

  //Create skin.
  class SimpleSkin extends Skin {
    constructor(id, drawable) {
      super(id, renderer);
      
      this.drawable = drawable;
      
      this.canvas = document.createElement("canvas");
      this.canvas.width = 480;
      this.canvas.height = 360;
      this.ctx = this.canvas.getContext("2d",{willReadFrequently:true});
      
      this._size = [480,360];
      this._rotationCenter = [240,180];
      
      this.image_cache = {};
      
      this.imageSmoothing = true;
      this.ctx.imageSmoothingEnabled = true;
      
      this._render();
    }
    
    //Skin api.
    dispose() {
      if (this._texture) {
        gl.deleteTexture(this._texture);
        this._texture = null;
      }
      this.canvas.width = 0;
      this.canvas.height = 0;
      this.canvas = null;
      this.ctx = null;
      this.image_cache = null;
      super.dispose();
    }
    
    //Skin api.
    get size() {
      return this._size;
    }
    
    //Skin api.
    getTexture(scale) {
      return this._texture || super.getTexture();
    }
    
    //Skin api.
    useNearest() {
      return !this.imageSmoothing;
    }
    
    _render() {
      if (!this._texture) {
        this._texture = twgl.createTexture(gl, {
          auto: false,
          wrap: gl.CLAMP_TO_EDGE,
        });
      }
      this._setTexture(this.canvas);
      
      this.emitWasAltered();
    }
  }
  
  const createCostumeSkin = (target) => {
    const drawable = renderer._allDrawables[target.drawableID];
    const id = renderer._nextSkinId++;
    const skin = new SimpleSkin(id, drawable);
    renderer._allSkins[id] = skin;
    return skin;
  };

  class DJYReCanvas {
    constructor() {
      const self = this;
      const publicApi = 
        vm.runtime.ext_DJYReCanvasApi ?? (vm.runtime.ext_DJYReCanvasApi = {});
      publicApi.redraw = function () {
        for (const target of vm.runtime.targets) {
          if (self._hasState(target)) {
            const state = self._getState(target);
            if (state.dirty) {
              state.skin._render();
              state.dirty = false;
            }
          }
        }
      }
      const originalDraw = renderer.draw;
      renderer.draw = function (...args) {
        publicApi.redraw();
        return originalDraw.apply(this, args);
      };
      renderer.draw.__DJYReCanvas_patched = true;
      vm.runtime.on("targetWasRemoved", (target) => {
        if (this._hasState(target)) {
          const state = this._getState(target);
          renderer.destroySkin(state.skin.id);
          delete target[CUSTOM_STATE_KEY];
        }
      });
      vm.runtime.on("EXTENSION_ADDED", () => {
        if (!renderer.draw.__DJYReCanvas_patched) {
          setTimeout(() => {
            console.log("ReCanvas : Updating draw function.")
            const originalDraw = renderer.draw;
            renderer.draw = function (...args) {
              publicApi.redraw();
              return originalDraw.apply(this, args);
            };
            renderer.draw.__DJYReCanvas_patched = true;
          },500)
        }
      });
    }
    
    getInfo() {
      return {
        id: "DJYReCanvas",
        name: "Re:Canvas",
        color1: ReduxStore.getState().scratchGui.theme.theme.getStageBlockColors().pen.primary,
        color2: ReduxStore.getState().scratchGui.theme.theme.getStageBlockColors().pen.secondary,
        color3: ReduxStore.getState().scratchGui.theme.theme.getStageBlockColors().pen.tertiary,
        docsURI: "https://destrainjury.wuaze.com/50/",
        blocks: [
          {
            blockType:Scratch.BlockType.BUTTON,
            text: "关于扩展",
            func: "openAboutAlert",
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "基础",
          },
          {
            opcode: "enableCanvas",
            blockType: Scratch.BlockType.COMMAND,
            text: "启用canvas",
            extensions: ["colours_pen"],
          },
          {
            opcode: "disableCanvas",
            blockType: Scratch.BlockType.COMMAND,
            text: "禁用canvas",
            extensions: ["colours_pen"],
          },
          {
            opcode: "setCanvasSize",
            blockType: Scratch.BlockType.COMMAND,
            text: "清空并设置canvas的宽度为[width],缩放为[scaleWidth],高度为[height],缩放为[scaleHeight]",
            arguments: {
              width: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "480",
              },
              height: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "360",
              },
              scaleWidth: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "1",
              },
              scaleHeight: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "1",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "矩形",
          },
          {
            opcode: "fillRect",
            blockType: Scratch.BlockType.COMMAND,
            text: "矩形填充 x[x],y[y],宽度[width],高度[height]",
            arguments: {
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              width: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "240",
              },
              height: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "180",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "strokeRect",
            blockType: Scratch.BlockType.COMMAND,
            text: "矩形描边 x[x],y[y],宽度[width],高度[height]",
            arguments: {
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              width: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "240",
              },
              height: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "180",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "clearRect",
            blockType: Scratch.BlockType.COMMAND,
            text: "矩形擦除 x[x],y[y],宽度[width],高度[height]",
            arguments: {
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              width: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "240",
              },
              height: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "180",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "文字",
          },
          {
            opcode: "fillText",
            blockType: Scratch.BlockType.COMMAND,
            text: "文字填充 文本[text],x[x],y[y]",
            arguments: {
              text: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "文本",
              },
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "100",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "strokeText",
            blockType: Scratch.BlockType.COMMAND,
            text: "文字描边 文本[text],x[x],y[y]",
            arguments: {
              text: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "文本",
              },
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "100",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "measureText",
            blockType: Scratch.BlockType.REPORTER,
            text: "[text]的渲染宽度",
            arguments: {
              text: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "文本",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "图像",
          },
          {
            opcode: "loadImageAs",
            blockType: Scratch.BlockType.COMMAND,
            text: "加载图像 名字[name],url[url]",
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "名字",
              },
              url: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://extensions.turbowarp.org/dango.png",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "loadImageAsWait",
            blockType: Scratch.BlockType.COMMAND,
            text: "加载图像并等待 名字[name],url[url]",
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "名字",
              },
              url: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://extensions.turbowarp.org/dango.png",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "drawImage",
            blockType: Scratch.BlockType.COMMAND,
            text: "绘制图像 名字[name],x[x],y[y]",
            arguments: {
              name: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "名字",
              },
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "路径",
          },
          {
            opcode: "fill",
            blockType: Scratch.BlockType.COMMAND,
            text: "填充",
            extensions: ["colours_pen"],
          },
          {
            opcode: "stroke",
            blockType: Scratch.BlockType.COMMAND,
            text: "描边",
            extensions: ["colours_pen"],
          },
          {
            opcode: "clip",
            blockType: Scratch.BlockType.COMMAND,
            text: "剪切",
            extensions: ["colours_pen"],
          },
          {
            opcode: "beginPath",
            blockType: Scratch.BlockType.COMMAND,
            text: "开始描绘路径",
            extensions: ["colours_pen"],
          },
          {
            opcode: "closePath",
            blockType: Scratch.BlockType.COMMAND,
            text: "闭合描绘路径",
            extensions: ["colours_pen"],
          },
          {
            opcode: "moveTo",
            blockType: Scratch.BlockType.COMMAND,
            text: "移动到 x[x],y[y]",
            arguments: {
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "lineTo",
            blockType: Scratch.BlockType.COMMAND,
            text: "画线到 x[x],y[y]",
            arguments: {
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "rect",
            blockType: Scratch.BlockType.COMMAND,
            text: "创建矩形 x[x],y[y],宽度[width],高度[height]",
            arguments: {
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              width: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "240",
              },
              height: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "180",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "roundRect",
            blockType: Scratch.BlockType.COMMAND,
            text: "创建圆角矩形 x[x],y[y],宽度[width],高度[height],圆角半径[radius]",
            arguments: {
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "100",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "100",
              },
              width: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "200",
              },
              height: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "200",
              },
              radius: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "10",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "arc",
            blockType: Scratch.BlockType.COMMAND,
            text: "创建圆弧 x[x],y[y],半径[r],起始角度[sAngle]rad,结束角度[eAngle]rad,[anticlockwise]绘制",
            arguments: {
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "100",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "75",
              },
              r: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "50",
              },
              sAngle: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              eAngle: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "3.142",
              },
              anticlockwise: {
                type: Scratch.ArgumentType.STRING,
                menu: "anticlockwise",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "arcTo",
            blockType: Scratch.BlockType.COMMAND,
            text: "创建两条切线之间的圆弧 x1[x1],y1[y1],x2[x2],y2[y2],半径[r]",
            arguments: {
              x1: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "100",
              },
              y1: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "20",
              },
              x2: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "100",
              },
              y2: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "70",
              },
              r: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "50",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "ellipse",
            blockType: Scratch.BlockType.COMMAND,
            text: "创建椭圆 x[x],y[y],半径x[radiusX],半径y[radiusY],旋转角度[rotation]rad,起始角度[sAngle]rad,结束角度[eAngle]rad,[anticlockwise]绘制",
            arguments: {
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "100",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "100",
              },
              radiusX: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "80",
              },
              radiusY: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "40",
              },
              rotation: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              sAngle: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              eAngle: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "6.283",
              },
              anticlockwise: {
                type: Scratch.ArgumentType.STRING,
                menu: "anticlockwise",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "bezierCurveTo",
            blockType: Scratch.BlockType.COMMAND,
            text: "创建三次贝塞尔曲线 控制点为cp1x[cp1x],cp1y[cp1y],cp2x[cp2x],cp2y[cp2y],结束点为x[x],y[y]",
            arguments: {
              cp1x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "10",
              },
              cp1y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "50",
              },
              cp2x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "100",
              },
              cp2y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "50",
              },
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "100",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "10",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "转换",
          },
          {
            opcode: "scale",
            blockType: Scratch.BlockType.COMMAND,
            text: "缩放 宽度[width]倍,高度[height]倍",
            arguments: {
              width: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "2",
              },
              height: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "2",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "rotate",
            blockType: Scratch.BlockType.COMMAND,
            text: "旋转 角度[angle]rad",
            arguments: {
              angle: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0.524",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "translate",
            blockType: Scratch.BlockType.COMMAND,
            text: "偏移 x[x],y[y]",
            arguments: {
              x: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "30",
              },
              y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "10",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "transform",
            blockType: Scratch.BlockType.COMMAND,
            text: "变换矩阵 水平缩放[a],水平倾斜[b],垂直倾斜[c],垂直缩放[d],水平移动[e],垂直移动[f]",
            arguments: {
              a: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "1",
              },
              b: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0.5",
              },
              c: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "-0.5",
              },
              d: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "1",
              },
              e: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "30",
              },
              f: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "10",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "resetTransform",
            blockType: Scratch.BlockType.COMMAND,
            text: "重置变换矩阵",
            extensions: ["colours_pen"],
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "样式",
          },
          {
            opcode: "fillStyle",
            blockType: Scratch.BlockType.COMMAND,
            text: "填充样式 颜色[color]",
            arguments: {
              color: {
                type: Scratch.ArgumentType.COLOR,
                defaultValue: "#66CCFF",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "strokeStyle",
            blockType: Scratch.BlockType.COMMAND,
            text: "描边样式 颜色[color]",
            arguments: {
              color: {
                type: Scratch.ArgumentType.COLOR,
                defaultValue: "#39C5BB",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "lineWidth",
            blockType: Scratch.BlockType.COMMAND,
            text: "线条宽度 宽度[width]",
            arguments: {
              width: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "10",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "lineCap",
            blockType: Scratch.BlockType.COMMAND,
            text: "线条线帽 样式[style]",
            arguments: {
              style: {
                type: Scratch.ArgumentType.STRING,
                menu: "lineCap",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "lineJoin",
            blockType: Scratch.BlockType.COMMAND,
            text: "线条边角 样式[style]",
            arguments: {
              style: {
                type: Scratch.ArgumentType.STRING,
                menu: "lineJoin",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "setLineDash",
            blockType: Scratch.BlockType.COMMAND,
            text: "线条实虚 数组[array]",
            arguments: {
              array: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "[10,5]",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "font",
            blockType: Scratch.BlockType.COMMAND,
            text: "文字字体 样式[style]",
            arguments: {
              style: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "50px arial",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "合成",
          },
          {
            opcode: "globalAlpha",
            blockType: Scratch.BlockType.COMMAND,
            text: "全局透明 透明度[alpha]",
            arguments: {
              alpha: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0.5",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "globalCompositeOperation",
            blockType: Scratch.BlockType.COMMAND,
            text: "合成模式 属性[attribute]",
            arguments: {
              attribute: {
                type: Scratch.ArgumentType.STRING,
                menu: "globalCompositeOperation",
              },
            },
            extensions: ["colours_pen"],
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "状态",
          },
          {
            opcode: "save",
            blockType: Scratch.BlockType.COMMAND,
            text: "保存画布状态",
            extensions: ["colours_pen"],
          },
          {
            opcode: "restore",
            blockType: Scratch.BlockType.COMMAND,
            text: "恢复画布状态",
            extensions: ["colours_pen"],
          },
          {
            blockType: Scratch.BlockType.LABEL,
            text: "调试",
          },
          {
            opcode: "getDescrepency",
            blockType: Scratch.BlockType.REPORTER,
            text: "舞台的[dimension]缩放倍增",
            arguments: {
              dimension: {
                type: Scratch.ArgumentType.STRING,
                menu: "dimensions",
              }
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "setCanvasImageSmoothing",
            blockType: Scratch.BlockType.COMMAND,
            text: "对canvas[options]平滑处理",
            arguments: {
              options: {
                type: Scratch.ArgumentType.STRING,
                menu: "options",
              }
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "imageSmoothingEnabled",
            blockType: Scratch.BlockType.COMMAND,
            text: "对缩放后的图片[options]平滑处理",
            arguments: {
              options: {
                type: Scratch.ArgumentType.STRING,
                menu: "options",
              }
            },
            extensions: ["colours_pen"],
          },
          {
            opcode: "getImageData",
            blockType: Scratch.BlockType.REPORTER,
            text: "getImageData",
            extensions: ["colours_pen"],
            hideFromPalette: true,
          },
        ],
        menus: {
          lineCap: {
            items: [
              {
                text:"平直",
                value:"butt",
              },
              {
                text:"圆形",
                value:"round",
              },
              {
                text:"矩形",
                value:"square",
              },
            ],
            acceptReporters: true
          },
          lineJoin: {
            items: [
              {
                text:"尖角",
                value:"miter",
              },
              {
                text:"圆角",
                value:"round",
              },
              {
                text:"斜角",
                value:"bevel",
              },
            ],
            acceptReporters: true
          },
          anticlockwise: {
            items: [
              {
                text:"顺时针",
                value:"false",
              },
              {
                text:"逆时针",
                value:"true",
              },
            ],
            acceptReporters: true
          },
          globalCompositeOperation: {
            items: [
              "source-over",
              "source-in",
              "source-out",
              "source-atop",
              "destination-over",
              "destination-in",
              "destination-out",
              "destination-atop",
              "lighter",
              "copy",
              "xor",
              "multiply",
              "screen",
              "overlay",
              "darken",
              "lighten",
              "color-dodge",
              "color-burn",
              "hard-light",
              "soft-light",
              "difference",
              "exclusion",
              "hue",
              "saturation",
              "color",
              "luminosity",
            ],
            acceptReporters: true
          },
          dimensions: {
            items: [
              {
                text:"宽度",
                value:"width",
              },
              {
                text:"高度",
                value:"height",
              },
            ],
            acceptReporters: true
          },
          options: {
            items: [
              {
                text:"启用",
                value:"true",
              },
              {
                text:"禁用",
                value:"false",
              },
            ],
            acceptReporters: true
          },
        },
      };
    }

    //Helper.
    _getState(target) {
      const state = target[CUSTOM_STATE_KEY];
      if (!state) {
        const newState = {
          skin: createCostumeSkin(target),
          dirty: false,
        };
        target[CUSTOM_STATE_KEY] = newState;
        return newState;
      }
      return state;
    }
    
    //Helper.
    _hasState(target) {
      return !!target[CUSTOM_STATE_KEY];
    }
    
    //Helper.
    _render(target, state) {
      renderer.updateDrawableSkinId(target.drawableID, state.skin.id);
    }
    
    //Helper.
    _hide(target, state) {
      target.setCostume(target.currentCostume);
    }

    openAboutAlert() {
      alert('作者:_DestrainJurY_\n版本:v3 release\n\n温馨提示:请勿在很大的canvas画布且用很多克隆体重复刷新画布.\n除非你的设备能够足够处理这些数据,否则后果自负.');
    }
    enableCanvas(args, util) {
      const state = this._getState(util.target);
      this._render(util.target, state);
      util.runtime.requestRedraw();
    }
    
    disableCanvas(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        this._hide(util.target, state);
      }
    }
    
    setCanvasSize(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.canvas.width = args.width * args.scaleWidth;
        state.skin.canvas.height = args.height * args.scaleHeight;
        state.skin.ctx.scale(args.scaleWidth,args.scaleHeight);
        state.skin._size = [args.width,args.height];
        state.skin._rotationCenter = [args.width / 2,args.height / 2];
        state.dirty = true;
        util.runtime.requestRedraw();
      }
    }
    
    fillRect(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.fillRect(args.x,args.y,args.width,args.height);
        state.dirty = true;
        util.runtime.requestRedraw();
      }
    }
    
    strokeRect(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.strokeRect(args.x,args.y,args.width,args.height);
        state.dirty = true;
        util.runtime.requestRedraw();
      }
    }
    
    clearRect(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.clearRect(args.x,args.y,args.width,args.height);
        state.dirty = true;
        util.runtime.requestRedraw();
      }
    }
    
    fillText(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.fillText(args.text,args.x,args.y);
        state.dirty = true;
        util.runtime.requestRedraw();
      }
    }
    
    strokeText(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.strokeText(args.text,args.x,args.y);
        state.dirty = true;
        util.runtime.requestRedraw();
      }
    }
    
    measureText(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        return state.skin.ctx.measureText(args.text).width;
      }
    }
    
    loadImageAs(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        if (state.skin.image_cache[args.name.toString()]) return;
        Scratch.canFetch(args.url).then((ok) => {
          if (!ok) throw new Error("unable to access to `" + args.url + "`");
          
          const image = new Image();
          image.src = args.url;
          image.setAttribute("crossOrigin",'anonymous');
          image.onload = () => {
            state.skin.image_cache[args.name.toString()] = image;
          };
          image.onerror = console.error;
        }).catch(console.error);
      }
    }
    
    loadImageAsWait(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        if (state.skin.image_cache[args.name.toString()]) return;
        return new Promise((resolve, reject) => {
          Scratch.canFetch(args.url).then((ok) => {
            if (!ok) throw new Error("unable to access to `" + args.url + "`");
            
            const image = new Image();
            image.src = args.url;
            image.setAttribute("crossOrigin",'anonymous');
            image.onload = () => {
              state.skin.image_cache[args.name.toString()] = image;
              resolve();
            };
            image.onerror = reject;
          });
        }).catch(console.error);
      }
    }
    
    drawImage(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        const idx = parseInt(args.name);
        let image;
        if (isNaN(idx)) {
          image = state.skin.image_cache[args.name.toString()];
        } else {
          return;
        }
        image && state.skin.ctx.drawImage(image,args.x,args.y);
        state.dirty = true;
        util.runtime.requestRedraw();
      }
    }
    
    fill(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.fill();
        state.dirty = true;
        util.runtime.requestRedraw();
      }
    }
    
    stroke(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.stroke();
        state.dirty = true;
        util.runtime.requestRedraw();
      }
    }
    
    clip(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.clip();
        state.dirty = true;
        util.runtime.requestRedraw();
      }
    }
    
    beginPath(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.beginPath();
      }
    }
    
    closePath(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.closePath();
      }
    }
    
    moveTo(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.moveTo(args.x,args.y);
      }
    }
    
    lineTo(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.lineTo(args.x,args.y);
      }
    }
    
    rect(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.rect(args.x,args.y,args.width,args.height);
      }
    }
    
    roundRect(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.roundRect(args.x,args.y,args.width,args.height,args.radius);
      }
    }
    
    arc(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.arc(args.x,args.y,args.r,args.sAngle,args.eAngle,Scratch.Cast.toBoolean(args.anticlockwise));
      }
    }
    
    arcTo(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.arcTo(args.x1,args.y1,args.x2,args.y2,args.r);
      }
    }
    
    ellipse(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.ellipse(args.x,args.y,args.radiusX,args.radiusY,args.rotation,args.sAngle,args.eAngle,Scratch.Cast.toBoolean(args.anticlockwise));
      }
    }
    
    bezierCurveTo(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.bezierCurveTo(args.cp1x,args.cp1y,args.cp2x,args.cp2y,args.x,args.y);
      }
    }
    
    scale(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.scale(args.width,args.height);
      }
    }
    
    rotate(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.rotate(args.angle);
      }
    }
    
    translate(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.translate(args.x,args.y);
      }
    }
    
    transform(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.transform(args.a,args.b,args.c,args.d,args.e,args.f);
      }
    }
    
    resetTransform(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.resetTransform();
      }
    }
    
    fillStyle(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.fillStyle = args.color;
      }
    }
    
    strokeStyle(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.strokeStyle = args.color;
      }
    }
    
    lineWidth(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.lineWidth = args.width;
      }
    }
    
    lineCap(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.lineCap = args.style;
      }
    }
    
    lineJoin(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.lineJoin = args.style;
      }
    }
    
    setLineDash(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.setLineDash(JSON.parse(args.array));
      }
    }
    
    font(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.font = args.style;
      }
    }
    
    globalAlpha(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.globalAlpha = args.alpha;
      }
    }
    
    globalCompositeOperation(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.globalCompositeOperation = args.attribute;
      }
    }
    
    save(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.save();
      }
    }
    
    restore(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.restore();
      }
    }
    
    getDescrepency(args) {
      if (args.dimension == "width") {
        return gl.canvas.width / renderer._nativeSize[0];
      }
      return gl.canvas.height / renderer._nativeSize[1];
    }
    
    setCanvasImageSmoothing(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.imageSmoothing = Scratch.Cast.toBoolean(args.options);
      }
    }
    
    imageSmoothingEnabled(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        state.skin.ctx.imageSmoothingEnabled = Scratch.Cast.toBoolean(args.options);
      }
    }
    
    getImageData(args, util) {
      if (this._hasState(util.target)) {
        const state = this._getState(util.target);
        //console.log(state.skin.ctx.getImageData(0,0,gl.canvas.width,gl.canvas.height));
        return state.skin.ctx.getImageData(0,0,gl.canvas.width,gl.canvas.height);
      }
    }
  }

  Scratch.extensions.register(new DJYReCanvas());
})(Scratch);
