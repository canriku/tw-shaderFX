class ShaderFX {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.time = 0;
    this.waveEnabled = false;
    this.animationFrame = null;
  }

  getInfo() {
    return {
      id: 'shaderfx',
      name: 'Shader FX',
      blocks: [
        {
          opcode: 'startWave',
          blockType: 'COMMAND',
          text: '画面をうねうねさせる [強さ]',
          arguments: {
            strength: {
              type: 'NUMBER',
              defaultValue: 5
            }
          }
        },
        {
          opcode: 'rgbSplit',
          blockType: 'COMMAND',
          text: 'RGB分離 [強さ]',
          arguments: {
            strength: {
              type: 'NUMBER',
              defaultValue: 5
            }
          }
        },
        {
          opcode: 'glitch',
          blockType: 'COMMAND',
          text: 'グリッチ効果 [頻度] [強さ]',
          arguments: {
            frequency: { type: 'NUMBER', defaultValue: 0.5 },
            strength: { type: 'NUMBER', defaultValue: 10 }
          }
        },
        {
          opcode: 'reset',
          blockType: 'COMMAND',
          text: 'シェーダーをリセット'
        }
      ]
    };
  }

  _initCanvas() {
    if (!this.canvas) {
      this.canvas = document.getElementById('scratch-stage');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
      }
    }
  }

  startWave(args) {
    this._initCanvas();
    this.waveEnabled = true;
    const strength = args.strength;

    const loop = () => {
      if (!this.waveEnabled) return;
      this.time += 1;

      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      const data = imageData.data;
      const width = this.canvas.width;

      for (let y = 0; y < this.canvas.height; y++) {
        const offset = Math.sin(y / 10 + this.time / 10) * strength;
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const shiftedX = Math.min(width - 1, Math.max(0, x + offset));
          const j = (y * width + shiftedX) * 4;
          data[i] = data[j];
          data[i + 1] = data[j + 1];
          data[i + 2] = data[j + 2];
        }
      }

      this.ctx.putImageData(imageData, 0, 0);
      this.animationFrame = requestAnimationFrame(loop);
    };

    loop();
  }

  rgbSplit(args) {
    this._initCanvas();
    const strength = args.strength;
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i + strength] || data[i];       // Red
      data[i + 1] = data[i + 1 - strength] || data[i + 1]; // Green
      data[i + 2] = data[i + 2 + strength] || data[i + 2]; // Blue
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  glitch(args) {
    this._initCanvas();
    const freq = args.frequency;
    const strength = args.strength;

    if (Math.random() < freq) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const w = 50 + Math.random() * strength;
      const h = 10 + Math.random() * strength;

      const imageData = this.ctx.getImageData(x, y, w, h);
      this.ctx.putImageData(imageData, x + Math.random() * 20 - 10, y + Math.random() * 20 - 10);
    }
  }

  reset() {
    this.waveEnabled = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this._initCanvas();
    // 画面のリセットはScratch側の再描画に任せる
  }
}

Scratch.extensions.register(new ShaderFX());
