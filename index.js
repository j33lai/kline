(async function () {
    const seriesData = await fetchSeriesData()
    console.log('seriesData: ', seriesData)
    let updateData = seriesData;
    updateData = updateData.slice(300,500); // too many his data, only load 200 instead
    let draw_obj = new Draw(updateData);
    subscribe(data => { // data: [time, open, high, low, close]
        draw_obj.processData(data);
    })
    // [time, open, high, low, close][]
    function fetchSeriesData() {
        return new Promise((resolve, reject) => {
            fetch('https://www.binance.com/api/v1/klines?symbol=BTCUSDT&interval=1m')
                .then(async res => {
                    const data = await res.json()
                    const result = data.map(([time, open, high, low, close]) => [time, open, high, low, close])
                    resolve(result)
                })
                .catch(e => reject(e))
        })
    }
    function subscribe(success) {
        try {
            const socket = new WebSocket('wss://stream.binance.com/stream?streams=btcusdt@kline_1m')
            socket.onmessage = e => {
                const res = JSON.parse(e.data)
                const { t, o, h, l, c } = res.data.k
                success([t, o, h, l, c]);
            }
        } catch(e) {
            console.error(e.message)
        }
    }
})()

function Draw(seriesData) {
    //this.seriesData = seriesData;
    this.c= document.getElementById("kline")
    this.ctx = this.c.getContext("2d");

    this.w = this.c.getAttribute('width')*1;
    this.h = this.c.getAttribute('height')*1;

    this.n = seriesData.length;
    this.W = 0.85*w/this.n;
    this.pos_init = 0.04*w;

    this.BL = Math.min.apply(null, seriesData.map(x => x[3]));
    this.BH = Math.max.apply(null, seriesData.map(x => x[2]));
    this.d = 1;
    this.dh = 0;

    this.prevData = seriesData[this.n-1];

    this.drawLine = function(l, h, pos, color) {
        this.ctx.beginPath();
        this.ctx.moveTo(pos, l);
        this.ctx.lineTo(pos, h);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        this.ctx.closePath();
    };

    this.drawBar = function (op, cs, pos, color) {
        this.ctx.beginPath();
        this.ctx.fillStyle = color;
        if (op < cs) {
            this.ctx.fillRect(pos - this.W / 2, op, this.W, cs - op);
        } else {
            this.ctx.fillRect(pos - this.W / 2, cs, this.W, op - cs);
        }
        this.ctx.closePath();
    };

    this.scaleCord = function(y) {
        return 0.05*this.h + 0.9*this.h*(this.BH-y)/(this.BH-this.BL);
    };

    this.drawLast = function (data) {
        this.ctx.clearRect(this.pos_init+(this.n-1.5)*this.W, 0, this.W, this.h);
        let color = data[4] >= data[1] ? "green" : "red";
        let pos = this.pos_init + (this.n-1)*this.W;
        this.drawLine(this.scaleCord(data[3]), this.scaleCord(data[2]), pos, color);
        this.drawBar(this.scaleCord(data[1]), this.scaleCord(data[4]), pos, color);
    }

    this.drawY = function() {
        this.ctx.clearRect(0.9*this.w, 0, 0.1*this.w, this.h);
        this.ctx.strokeStyle = 'grey';
        this.ctx.fillStyle = 'grey';
        this.ctx.font = '30px sans-serif';
        this.ctx.beginPath();
        this.ctx.moveTo(this.w*0.9,0);
        this.ctx.lineTo(this.w*0.9, this.h);
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        //this.ctx.moveTo(this.w*0.01,0);
        //this.ctx.lineTo(this.w*0.01, this.h*1);


        let D = this.BH - this.BL;
        let d = 1;
        while (D/d <= 1 || D/d > 10) {
            if (D/d > 10) {
                d *= 10;
            } else if (d <= 1) {
                d /= 10;
            }
        }

        this.BL = (Math.floor(this.BL/d))*d;
        this.BH = (Math.floor(this.BH/d)+1)*d;


        let k = (this.BH-this.BL)/d;
        let hh = 0.9/ k;
        let tmp = this.BH;
        for (let i = 0; i < k+1; i++) {
            this.ctx.moveTo(this.w*0.9,(0.05 + i*hh)*this.h);
            this.ctx.lineTo(this.w*0.9025, (0.05 + i*hh)*this.h);
            this.ctx.fillText(tmp,this.w*0.903,(0.055 + i*hh)*this.h);
            this.ctx.stroke();
            tmp -= d;
        }
        this.d = d;
        this.dh = hh * this.h;
        this.ctx.closePath();
    }

    this.doShiftLeft = function () {
        this.ctx.clearRect(this.pos_init-this.W/2, 0, this.W, this.h);
        let imageData = this.ctx.getImageData(this.pos_init+this.W/2, 0, 0.851*this.w, this.h);
        this.ctx.putImageData(imageData, this.pos_init-this.W/2, 0);
    }

    this.doShiftY = function(y) {
        let imageData = this.ctx.getImageData(this.pos_init-this.W/2, 0, 0.851*this.w, this.h);
        this.ctx.clearRect(this.pos_init-this.W/2, 0, 0.851*this.w, this.h);
        this.ctx.putImageData(imageData, this.pos_init-this.W/2, y);
        this.drawY();
    }

    this.processData = function(data) {
        let last_time = this.prevData[0];

        if (data[1] > this.BH || data[2] < this.BL) {
            let dhh = 0;
            // break highest
            if (data[1] > this.BH) {
                while (data[2] > this.BH) {
                    this.BH += this.d;
                    this.BL += this.d;
                    dhh -= this.dh;
                }
            }

            // break lowest
            dhh = 0;
            if (data[2] < this.BL) {
                while (data[2] > this.BL) {
                    this.BH -= this.d;
                    this.BL -= this.d;
                    dhh += this.dh;
                }
            }

            this.doShiftY(dhh);

        }
        if (data[0] > last_time) {
            this.doShiftLeft();
            console.log(data);
        }

        this.drawLast(data);
        this.prevData = data;
    }

    this.drawY();
    seriesData.forEach(function (value, index) {
        let color = value[4] >= value[1] ? "green" : "red";
        let pos = this.pos_init + index*this.W;
        this.drawLine(this.scaleCord(value[3]), this.scaleCord(value[2]), pos, color);
        this.drawBar(this.scaleCord(value[1]), this.scaleCord(value[4]), pos, color);
    }, this);
}