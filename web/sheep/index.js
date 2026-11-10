
// 生成草
class Grass {
    constructor() {
        this.height = window.innerHeight
        this.width = window.innerWidth
        this.grassIndex = 8
        this.onGrassAll()
    }
    onGrassAll() {
        for(let i = 0;i<this.grassIndex;i++) {
            this.onGrass(this.width, i % 2 == 0?this.height / 2:this.height)
        }
    }
    onGrass(width, height){
        const top = onRandom(0, height)
        const left = onRandom(0, width)
        const div = document.createElement('div')
        div.className = ('item') + onRandom(1, 2)
        div.style.top = top + 'px'
        div.style.left = left + 'px'
        document.getElementById('grass').appendChild(div)
    }
}


class onProp {
    constructor() {
        this.maxLength = 7
        this.operation = true
        this.updated()
        this.click()
    }
    click() {
        const ele = document.querySelector('.content-box')
        ele.addEventListener('click', (e) => {
            if(e.target.className == 'content-box') return;
            if(e.target.getAttribute('click') == 'false') return;
            if(this.operation) {
                const alls = document.querySelectorAll('.rail-box div')
                const index = e.target.getAttribute('index')
                let addEle = true
                // const top = parseInt(e.target.style.top) + 100
                // const left = parseInt(e.target.style.left)

                for(let i = 0;i<alls.length;i++) {
                    const item = alls[i]
                    if(item.getAttribute('index') == index) {
                        const target = e.target
                        const div = document.createElement('div')
                        div.className = target.className
                        div.setAttribute('index', index)
                        // div.style.transition = 'all 1s'
                        // div.style.position = 'fixed'
                        // div.style.zIndex = 100
                        // div.style.top = top+'px'
                        // div.style.left = left+'px'

                        ele.removeChild(target)
                        document.querySelector('.rail-box').insertBefore(div, item)
                        addEle = false
                        break
                    }

                }

                if(addEle) {
                    document.querySelector('.rail-box').appendChild(e.target)
                }
                // // ele.removeChild(e.target)
                setTimeout(() => {
                    this.calculate()
                }, 100);

            }
        })

    }

    calculate() {
        const alls = document.querySelectorAll('.rail-box div')

        let obj = {}
        for(let i = 0;i<alls.length;i++) {
            const index = alls[i].getAttribute('index')
            if(obj[index]){
                obj[index].push(alls[i])
            } else {
                obj[index] = [alls[i]]
            }
        }
        Object.values(obj).forEach(i => {
            if(i.length == 3) {
                i.forEach(i => document.querySelector('.rail-box').removeChild(i))
            }
        })
        this.onMask()

        if(document.querySelectorAll('.content-box div').length == 0 && document.querySelectorAll('.rail-box div').length == 0) {
            alert('恭喜您过关了')
            this.operation = false
            new Grass()
            new onProp()
            return
        }

        if(this.maxLength <= document.querySelectorAll('.rail-box div').length) {
            alert('游戏结束，您失败了')
            this.operation = false
        }
    }

    updated (total = 30) {
        const index = 14
        for(let i = 0; i<total;i++) {
            const random = onRandom(1, index)
            for(let i = 0; i<3;i++) {
                this.mahjong(random)
            }
        }

        this.onMask()
    }

    mahjong(index = '1') {
        const padding = 30
        const ele = document.querySelector('.content-box')
        const height = ele.offsetHeight - 120
        const width = ele.offsetWidth - 80
        this.create(onRandom(padding, height), onRandom(padding, width), 'prop' + index, index)
    }

    onMask() {
        const ele = document.querySelectorAll('.content-box div')
        for(let i = 0; i<ele.length;i++) {
            var a = new IntersectionObserver(([change]) => {
                if(change.isVisible == false) {
                    ele[i].classList.add('mask')
                    ele[i].setAttribute('click', false)
                } else {
                    ele[i].classList.remove('mask')
                    ele[i].setAttribute('click', true)
                }
            }, {
                threshold: [1.0],
                delay: 1000,
                trackVisibility: true,
            })
            a.observe(ele[i])
        }
    }

    create(top, left, className = 'prop', index) {
        const div = document.createElement('div')
        div.setAttribute('index', index)
        div.className = className
        div.style.top = top + 'px'
        div.style.left = left + 'px'
        document.querySelector('.content-box').appendChild(div)
    }
}




new Grass()
new onProp()














function onRandom(lowerValue = 0, upperValue = 100){
    const val = upperValue - lowerValue + 1
    return Math.floor(Math.random() * val + lowerValue)
}




document.querySelector('.btn-box').addEventListener('click', (e) => {
    setTimeout(() => {
        document.querySelector('.content-box').style.transform = 'rotate(2160deg)'
    }, 0);
    setTimeout(() => {
        document.querySelector('.content-box').style.transform = 'rotate(-2520deg)'
    }, 1000);
    setTimeout(() => {
        document.querySelector('.content-box').style.transform = 'rotate(0deg)'
    }, 2000);

    // a.onMask()
})