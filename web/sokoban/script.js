// 推箱子游戏主逻辑
class SokobanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 40;
        this.moves = 0;
        this.currentLevel = 0;
        
        // 游戏元素定义
        this.TILE_EMPTY = 0;
        this.TILE_WALL = 1;
        this.TILE_BOX = 2;
        this.TILE_TARGET = 3;
        this.TILE_PLAYER = 4;
        this.TILE_BOX_ON_TARGET = 5;
        this.TILE_PLAYER_ON_TARGET = 6;
        
        // 关卡数据
        this.levels = [
            [
                [1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 0, 2, 0, 0, 0, 1],
                [1, 0, 0, 4, 3, 0, 1],
                [1, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1]
            ],
            [
                [1, 1, 1, 1, 1, 1, 1, 1],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [1, 0, 2, 2, 0, 0, 0, 1],
                [1, 0, 0, 0, 4, 3, 3, 1],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [1, 1, 1, 1, 1, 1, 1, 1]
            ]
        ];
        
        this.currentMap = [];
        this.playerPos = { x: 0, y: 0 };
        this.boxes = [];
        this.targets = [];
        
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        this.loadLevel(this.currentLevel);
        this.render();
        this.updateMovesDisplay();
    }
    
    loadLevel(levelIndex) {
        this.currentMap = JSON.parse(JSON.stringify(this.levels[levelIndex]));
        this.moves = 0;
        this.boxes = [];
        this.targets = [];
        
        // 找到玩家位置和目标位置
        for (let y = 0; y < this.currentMap.length; y++) {
            for (let x = 0; x < this.currentMap[y].length; x++) {
                if (this.currentMap[y][x] === this.TILE_PLAYER || 
                    this.currentMap[y][x] === this.TILE_PLAYER_ON_TARGET) {
                    this.playerPos = { x: x, y: y };
                }
                if (this.currentMap[y][x] === this.TILE_TARGET || 
                    this.currentMap[y][x] === this.TILE_BOX_ON_TARGET ||
                    this.currentMap[y][x] === this.TILE_PLAYER_ON_TARGET) {
                    this.targets.push({ x: x, y: y });
                }
                if (this.currentMap[y][x] === this.TILE_BOX || 
                    this.currentMap[y][x] === this.TILE_BOX_ON_TARGET) {
                    this.boxes.push({ x: x, y: y });
                }
            }
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    this.movePlayer(0, -1);
                    break;
                case 'ArrowDown':
                    this.movePlayer(0, 1);
                    break;
                case 'ArrowLeft':
                    this.movePlayer(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePlayer(1, 0);
                    break;
            }
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetLevel();
        });
        
        document.getElementById('next-level-btn').addEventListener('click', () => {
            this.nextLevel();
        });
        
        document.getElementById('prev-level-btn').addEventListener('click', () => {
            this.prevLevel();
        });
    }
    
    movePlayer(dx, dy) {
        const newX = this.playerPos.x + dx;
        const newY = this.playerPos.y + dy;
        
        // 检查是否可以移动到新位置
        if (this.canMoveTo(newX, newY)) {
            // 检查是否推箱子
            const nextX = newX + dx;
            const nextY = newY + dy;
            
            const currentTile = this.currentMap[newY][newX];
            const isBox = (currentTile === this.TILE_BOX || currentTile === this.TILE_BOX_ON_TARGET);
            
            if (isBox && this.canMoveTo(nextX, nextY)) {
                // 推箱子
                this.pushBox(newX, newY, nextX, nextY);
                this.updatePlayerPosition(newX, newY);
            } else if (!isBox) {
                // 直接移动
                this.updatePlayerPosition(newX, newY);
            }
            
            this.moves++;
            this.updateMovesDisplay();
            this.render();
            
            // 检查是否完成关卡
            if (this.isLevelComplete()) {
                setTimeout(() => {
                    alert('恭喜！你完成了这个关卡！');
                    this.nextLevel();
                }, 100);
            }
        }
    }
    
    canMoveTo(x, y) {
        if (x < 0 || y < 0 || y >= this.currentMap.length || x >= this.currentMap[y].length) {
            return false;
        }
        const tile = this.currentMap[y][x];
        return tile !== this.TILE_WALL;
    }
    
    pushBox(fromX, fromY, toX, toY) {
        const fromTile = this.currentMap[fromY][fromX];
        const toTile = this.currentMap[toY][toX];
        
        // 更新箱子原来的位置
        if (fromTile === this.TILE_BOX) {
            this.currentMap[fromY][fromX] = this.TILE_EMPTY;
        } else if (fromTile === this.TILE_BOX_ON_TARGET) {
            this.currentMap[fromY][fromX] = this.TILE_TARGET;
        }
        
        // 更新箱子新的位置
        if (toTile === this.TILE_EMPTY) {
            this.currentMap[toY][toX] = this.TILE_BOX;
        } else if (toTile === this.TILE_TARGET) {
            this.currentMap[toY][toX] = this.TILE_BOX_ON_TARGET;
        }
        
        // 更新箱子数组
        const boxIndex = this.boxes.findIndex(box => box.x === fromX && box.y === fromY);
        if (boxIndex !== -1) {
            this.boxes[boxIndex] = { x: toX, y: toY };
        }
    }
    
    updatePlayerPosition(x, y) {
        // 清除玩家原来的位置
        const oldTile = this.currentMap[this.playerPos.y][this.playerPos.x];
        if (oldTile === this.TILE_PLAYER) {
            this.currentMap[this.playerPos.y][this.playerPos.x] = this.TILE_EMPTY;
        } else if (oldTile === this.TILE_PLAYER_ON_TARGET) {
            this.currentMap[this.playerPos.y][this.playerPos.x] = this.TILE_TARGET;
        }
        
        // 设置玩家新的位置
        const newTile = this.currentMap[y][x];
        if (newTile === this.TILE_EMPTY) {
            this.currentMap[y][x] = this.TILE_PLAYER;
        } else if (newTile === this.TILE_TARGET) {
            this.currentMap[y][x] = this.TILE_PLAYER_ON_TARGET;
        }
        
        this.playerPos = { x: x, y: y };
    }
    
    isLevelComplete() {
        // 检查所有箱子是否都在目标点上
        for (const box of this.boxes) {
            let onTarget = false;
            for (const target of this.targets) {
                if (box.x === target.x && box.y === target.y) {
                    onTarget = true;
                    break;
                }
            }
            if (!onTarget) {
                return false;
            }
        }
        return true;
    }
    
    resetLevel() {
        this.loadLevel(this.currentLevel);
        this.render();
    }
    
    nextLevel() {
        if (this.currentLevel < this.levels.length - 1) {
            this.currentLevel++;
            this.loadLevel(this.currentLevel);
            this.render();
        } else {
            alert('恭喜！你已经完成了所有关卡！');
        }
    }
    
    prevLevel() {
        if (this.currentLevel > 0) {
            this.currentLevel--;
            this.loadLevel(this.currentLevel);
            this.render();
        }
    }
    
    updateMovesDisplay() {
        document.getElementById('moves').textContent = this.moves;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < this.currentMap.length; y++) {
            for (let x = 0; x < this.currentMap[y].length; x++) {
                const tile = this.currentMap[y][x];
                const posX = x * this.tileSize;
                const posY = y * this.tileSize;
                
                switch(tile) {
                    case this.TILE_WALL:
                        this.ctx.fillStyle = '#8B4513';
                        this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                        break;
                    case this.TILE_TARGET:
                    case this.TILE_BOX_ON_TARGET:
                    case this.TILE_PLAYER_ON_TARGET:
                        this.ctx.fillStyle = '#90EE90';
                        this.ctx.fillRect(posX, posY, this.tileSize, this.tileSize);
                        // 绘制目标点标记
                        this.ctx.strokeStyle = '#006400';
                        this.ctx.lineWidth = 2;
                        this.ctx.strokeRect(posX + 5, posY + 5, this.tileSize - 10, this.tileSize - 10);
                        break;
                }
                
                switch(tile) {
                    case this.TILE_BOX:
                    case this.TILE_BOX_ON_TARGET:
                        this.ctx.fillStyle = '#FF6347';
                        this.ctx.fillRect(posX + 5, posY + 5, this.tileSize - 10, this.tileSize - 10);
                        break;
                    case this.TILE_PLAYER:
                    case this.TILE_PLAYER_ON_TARGET:
                        this.ctx.fillStyle = '#4169E1';
                        this.ctx.beginPath();
                        this.ctx.arc(posX + this.tileSize/2, posY + this.tileSize/2, this.tileSize/3, 0, Math.PI * 2);
                        this.ctx.fill();
                        break;
                }
            }
        }
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new SokobanGame();
});