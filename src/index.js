const VueApp = {
    data() {
        return {
            // 车身矩阵
            leftSpacing: 40,
            topSpacing: 40,
            carLength: 160,
            carHeight: 50,

            // 左侧车轮
            wheelSpacing: 80,
            wheelRadius: 20,

            // 右侧车轮

            // 道路
            roadBegin: 0,
            roadEnd: 1000,
            roadLength: 50,
            roadSpacing: 100,

            // 绳子
            ropeLength: 150,

            // 小球
            ballRadius: 10,

            // 画布
            canvas1: null,
            ctx1: null,
            canvas2: null,
            ctx2: null,

            // 仿真参数
            speed: 100,     // 车辆速度
            deltaT: 0.01,   // 仿真步长
            t: 0,           // 仿真时间
            u: 0 - 0.0025,          // 
            x: [0, 0],

            T: 1.986917653159220,
            simSpeed: 1,
            simAcc: 1,

            scale: 100,

            carCenter: null,
            ropeTheta: null,

            timer1: null,
            timer2: null,

            state: false
        }
    },
    methods: {
        run01() {
            if (this.timer1) {
                clearInterval(this.timer1)
            }
            if (this.timer2) {
                clearInterval(this.timer2)
            }
            this.init()
            const state = false

            this.timer1 = setInterval(this.simulation, this.deltaT * 1000, state)
        },
        run02() {
            if (this.timer2) {
                clearInterval(this.timer2)
            }
            if (this.timer1) {
                clearInterval(this.timer1)
            }
            this.init()
            const state = true

            this.timer2 = setInterval(this.simulation, this.deltaT * 1000, state)
        },

        init() {
            this.t = 0
            this.u = 0
            this.x = [0, 0]
            this.carCenter = [this.leftSpacing + this.carLength / 2, this.topSpacing + this.carHeight / 2]
            this.ropeTheta = 0
        },

        canvasRender(state) {
            var ctx
            if (state) {
                ctx = this.ctx2
            } else {
                ctx = this.ctx1
            }

            ctx.clearRect(0, 0, 1000, 1000)
            ctx.save(); //保存干净环境
            ctx.restore(); //环境释放

            // 车身矩阵
            ctx.strokeRect(this.carCenter[0] - this.carLength / 2, this.carCenter[1] - this.carHeight / 2, this.carLength, this.carHeight)

            // 左侧车轮
            const wheelY = this.carCenter[1] + this.carHeight / 2 + this.wheelRadius
            ctx.beginPath();
            ctx.arc(this.carCenter[0] - this.wheelSpacing / 2, wheelY, this.wheelRadius, 0, 2 * Math.PI);
            ctx.stroke();
            // 右侧车轮
            ctx.beginPath();
            ctx.arc(this.carCenter[0] + this.wheelSpacing / 2, wheelY, this.wheelRadius, 0, 2 * Math.PI);
            ctx.stroke();

            // 道路
            const roadY = this.carCenter[1] + this.carHeight / 2 + this.wheelRadius * 2
            ctx.beginPath()
            ctx.moveTo(this.roadBegin, roadY)
            ctx.lineTo(this.roadEnd, roadY)
            ctx.closePath();
            ctx.stroke();
            for (var i = 0; i < 10; i++) {
                ctx.beginPath()
                ctx.moveTo(this.roadBegin + 50 + this.roadSpacing * i, roadY)
                ctx.lineTo(this.roadBegin + 50 + this.roadSpacing * i + this.roadLength * Math.cos(3 * Math.PI / 4), roadY + this.roadLength * Math.sin(3 * Math.PI / 4))
                ctx.closePath();
                ctx.stroke();
            }

            // 绳子
            ctx.beginPath()
            ctx.moveTo(this.carCenter[0], this.carCenter[1] + this.carHeight / 2)
            ctx.lineTo(this.carCenter[0] + this.ropeLength * Math.sin(this.ropeTheta), this.carCenter[1] + this.carHeight / 2 + this.ropeLength * Math.cos(this.ropeTheta))
            ctx.closePath();
            ctx.stroke();


            // 小球
            ctx.beginPath();
            ctx.arc(this.carCenter[0] + (this.ropeLength + this.ballRadius) * Math.sin(this.ropeTheta), this.carCenter[1] + this.carHeight / 2 + (this.ropeLength + this.ballRadius) * Math.cos(this.ropeTheta), this.ballRadius, 0, 2 * Math.PI);
            ctx.stroke();
        },

        simulation(state) {
            this.carCenter[0] += this.speed * this.deltaT
            this.state = state

            const test2 = this.calculateU(0)
            this.u = test2[0]
            this.speed = test2[1]

            const test = this.ode4(this.t, this.x, this.u)
            this.t = test[0]
            this.x = test[1]
            this.ropeTheta = Math.atan((this.x[0] - this.u) / 1)

            this.canvasRender(this.state)

            if (this.timer1 && this.t > 15) {
                clearInterval(this.timer1)
            }
            if (this.timer2 && this.t > 15) {
                clearInterval(this.timer2)
            }
        },

        ode1(t, x, u) {
            const h = this.deltaT
            const dx = this.func(x, u)
            const xnew = this.addTwoArr(x, this.multiply(dx, h))
            const tnew = t + h
            return [tnew, xnew]
        },

        ode4(t, x, u) {
            var h = this.deltaT

            const test2 = this.calculateU(h / 2)
            const u2 = test2[0]
            const test3 = this.calculateU(h)
            const u3 = test3[0]

            var k1 = this.func(x, u)
            var k2 = this.func(this.addTwoArr(x, this.multiply(k1, h / 2)), u2)
            var k3 = this.func(this.addTwoArr(x, this.multiply(k2, h / 2)), u2)
            var k4 = this.func(this.addTwoArr(x, this.multiply(k3, h)), u3)

            var xnew = this.addTwoArr(x, this.multiply(this.addTwoArr(this.addTwoArr(this.addTwoArr(this.multiply(k3, 2), k4), this.multiply(k2, 2)), k1), h / 6))
            var tnew
            tnew = t + h
            return [tnew, xnew]
        },

        calculateU(th) {
            const ts = 0
            const tn = 5
            const ta = 1
            const pn = this.simSpeed * tn + this.simSpeed * ta
            var u1
            var speed1
            var u2
            var speed2
            if (this.t + th < ta) {
                u1 = 0.5 * this.simAcc * Math.pow((this.t + th - ts), 2)
                speed1 = this.simAcc * (this.t + th - ts) * this.scale
            } else if (this.t + th < (tn + ta)) {
                u1 = 0.5 * this.simAcc * Math.pow(ta, 2) + this.simSpeed * (this.t + th - ta)
                speed1 = this.simSpeed * this.scale
            } else if (this.t + th < (tn + 2 * ta)) {
                u1 = pn - 0.5 * this.simAcc * Math.pow(tn + 2 * ta - this.t - th, 2)
                speed1 = -this.simAcc * (this.t + th - (tn + 2 * ta)) * this.scale
            } else {
                u1 = pn
                speed1 = 0
            }

            if (this.t + th < this.T / 2) {
                u2 = 0
                speed2 = 0
            } else if (this.t + th < ta + this.T / 2) {
                u2 = 0.5 * this.simAcc * Math.pow((this.t + th - ts - this.T / 2), 2)
                speed2 = this.simAcc * (this.t + th - ts - this.T / 2) * this.scale
            } else if (this.t + th < (ta + tn + this.T / 2)) {
                u2 = 0.5 * this.simAcc * Math.pow(ta, 2) + this.simSpeed * (this.t + th - ta - this.T / 2)
                speed2 = this.simSpeed * this.scale
            } else if (this.t + th < (tn + 2 * ta + this.T / 2)) {
                u2 = pn - 0.5 * this.simAcc * Math.pow(tn + 2 * ta + this.T / 2 - this.t - th, 2)
                speed2 = - this.simAcc * (this.t + th - (tn + 2 * ta + this.T / 2)) * this.scale
            } else {
                u2 = pn
                speed2 = 0
            }

            var u
            var speed
            if (this.state) {
                u = 0.5 * u1 + 0.5 * u2
                speed = 0.5 * speed1 + 0.5 * speed2
            } else {
                u = u1
                speed = speed1
            }

            return [u, speed]
        },

        func(x, u) {
            const g = 10
            const L = 1

            var xd = u
            var xe = x[0]

            var theta = Math.atan((xe - xd) / L)
            var a = - g / L * Math.sin(theta)

            var dx = [0, 0]

            dx[0] = x[1]
            dx[1] = a * Math.cos(theta)

            return dx
        },

        multiply(arr1, dig) {
            var arr2 = [0, 0]
            arr1.map(function (value, index) {
                arr2[index] = arr1[index] * dig
            })
            return arr2
        },

        addTwoArr(arr1, arr2) {
            var arr3 = [0, 0]
            if (arr2.length == 0) {
                return arr1;
            } else {
                arr1.map(function (value, index) {
                    arr3[index] = arr2[index] + value
                })
            }
            return arr3
        }
    },
    mounted() {
        this.carCenter = [this.leftSpacing + this.carLength / 2, this.topSpacing + this.carHeight / 2]
        this.ropeTheta = 0
        this.canvas1 = document.getElementById('canvas1')
        this.ctx1 = canvas1.getContext('2d')
        this.canvas2 = document.getElementById('canvas2')
        this.ctx2 = canvas2.getContext('2d')
        this.canvasRender(true)
        this.canvasRender(false)
    },
}
