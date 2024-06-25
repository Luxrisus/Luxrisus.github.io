const LEVEL_PATH = "./levels/";
const SOUNDS_PATH = "./sounds/";
const MEDIA_PATH = "./media/";
const TAILLE_CARRE = 10;
var eatAudio = new Audio(SOUNDS_PATH+"eat.wav");
var deathAudio = new Audio(SOUNDS_PATH+"death.mp3");
var winAudio = new Audio(SOUNDS_PATH+"win.mp3");
var canvas, ctx, button, value, refreshButton, levelChoice, titre, name;

//TODO : faire un petit affichage tout mignon quand on gagne
//TODO : faire un affichage moins mignon quand on perd
//TODO : Prendre soin de soi 

window.addEventListener("load", init);


function init() {
    button = document.getElementById("startButton");

    button.addEventListener("click", function () {
        levelChoice = document.getElementById("levelChoice").value;

        titre = document.createElement("P");
        document.getElementById("page").appendChild(titre);
        
        canvas = document.createElement("canvas");
        canvas.setAttribute('id', 'canvas');
        if (canvas.getContext) {
            ctx = canvas.getContext('2d');
        }
        document.getElementById("page").appendChild(canvas);

        replayButton = document.createElement("button");
        replayButton.setAttribute('id', 'replayButton');
        replayButton.innerHTML = "Rejouer";
        document.getElementById("page").appendChild(replayButton);

        document.getElementById("header").remove();
        document.getElementById("toHide").remove();


        main(levelChoice);
    });
}


//-----------------UTILS CLASSES----------------------
class Snake {
    constructor(x, y) {
        this.xHead = x;
        this.yHead = y;
        this.xVel = 0;
        this.yVel = 0;
        this.snakeBody = [{
            "x": x,
            "y": y
        }]
        this.color = "green";
        this.prevDirection = null;
        this.length = 1;
    }

    move(direction) {
        switch (direction) {
            case 'right':
                if (this.prevDirection != "left") {
                    this.xVel = 1;
                    this.yVel = 0;
                    this.prevDirection = "right";
                }
                break;

            case 'left':
                if (this.prevDirection != "right") {
                    this.xVel = -1;
                    this.yVel = 0;
                    this.prevDirection = "left";
                }
                break;

            case 'up':
                if (this.prevDirection != "down") {
                    this.yVel = -1;
                    this.xVel = 0;
                    this.prevDirection = "up";
                }
                break;

            case 'down':
                if (this.prevDirection != "up") {
                    this.yVel = 1;
                    this.xVel = 0;
                    this.prevDirection = "down";
                }
                break;
        }
    }

    update() {
        this.xHead += this.xVel;
        this.yHead += this.yVel;
        var newHeadPos = { "x": this.xHead, "y": this.yHead };
        var len = this.snakeBody.push(newHeadPos);
        if (len > this.length) {
            this.snakeBody.shift();
        }
    }

    show() {
        for (var body in this.snakeBody) {
            drawSquare(this.snakeBody[body].x, this.snakeBody[body].y, TAILLE_CARRE, this.color);
        }

    }

    grow() {
        this.length++;
    }

    isDead(wall) {
        for (var i = 0; i < this.snakeBody.length - 1; i++) {
            if (this.xHead === this.snakeBody[i].x && this.yHead === this.snakeBody[i].y) {
                deathMessage();
                return true;
            }
        }

        for (var j = 0; j < wall.walls.length; j++) {
            if (wall.walls[j][0] === this.xHead && wall.walls[j][1] === this.yHead) {
                deathMessage();
                return true;
            }
        }
        return false;
    }

}

class Level {
    constructor(data) {
        this.properties = data;
    }
}

class Fruit {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = "red";
    }

    show() {
        drawSquare(this.x, this.y, TAILLE_CARRE, this.color);
    }

    isEaten(snake) {
        if (snake.xHead == this.x && snake.yHead == this.y) {
            return true;
        }
        return false;
    }
}

class Wall {
    constructor(lesMurs) {
        this.walls = lesMurs;
        this.color = "grey";
    }

    show() {
        for (var mur in this.walls) {
            drawSquare(this.walls[mur][0], this.walls[mur][1], TAILLE_CARRE, this.color);
        }
    }
}




//---------------------------MAIN---------------------------------
function main(levelNumber) {
    //initialisation du canvas

    var num = levelNumber;

    //Récupération des données liées au niveau choisi
    var req = new XMLHttpRequest();
    // console.log("GET", LEVEL_PATH + "level" + num + ".json");
    req.open("GET", LEVEL_PATH + "level" + num + ".json");
    req.onerror = function () {
        console.log("Problème de chargement");
    };

    var data, level;


    req.onload = function () {
        if (req.status == 200) {
            data = JSON.parse(req.responseText);
            level = new Level(data);

            var canvasWitdh = level.properties.dimensions[0];
            var canvasHeight = level.properties.dimensions[1];
            var snakePosition = level.properties.initialPosition;
            var fruitPosition = level.properties.fruit;
            var wallsPositions = level.properties.walls;
            var delay = level.properties.delay;
            var name = level.properties.name;

            canvas.width = canvasWitdh * TAILLE_CARRE;
            canvas.height = canvasHeight * TAILLE_CARRE;

            var fruitNumber = 0;
            var snake = new Snake(snakePosition[0], snakePosition[1]);
            var fruit = new Fruit(fruitPosition[fruitNumber][0], fruitPosition[fruitNumber][1]);
            var fruitCount = fruitPosition.length;
            var walls = new Wall(wallsPositions);

            var interval = setInterval(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                document.addEventListener("keydown", function (event) {
                    value = getKeyPress(event);
                    event.preventDefault();
                });
                snake.move(value);
                snake.update();
                fruit.show();
                snake.show();
                walls.show();
                if (fruit.isEaten(snake)) {
                    eatAudio.play();
                    snake.grow();
                    fruitNumber++;
                    if (fruitNumber === fruitCount) {
                        winMessage();
                        clearInterval(interval);
                    } else {
                        fruit = new Fruit(fruitPosition[fruitNumber][0], fruitPosition[fruitNumber][1]);
                    }
                }
                if (snake.xHead < 0 || snake.xHead > canvasWitdh || snake.yHead < 0 || snake.yHead > canvasHeight || snake.isDead(walls)) {

                    deathMessage();
                    clearInterval(interval)
                }
            }, delay);

        titre.innerHTML = name;

        } else {
            data = null;
            console.log("Erreur : " + req.status);
        }
        replayButton.addEventListener("click", function () {
            location.reload();
        });
        return data;
    };
    req.send();
    
}




//----------------------UTILS FUNCTIONS-------------------------------
function getKeyPress(event) {
    var keyName = event.key;
    switch (keyName) {
        case "ArrowLeft":
            return "left";
        case "ArrowRight":
            return "right";
        case "ArrowUp":
            return "up";
        case "ArrowDown":
            return "down";
        default:
            return null;
    }
}

function drawSquare(x, y, height, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = "black";
    ctx.fillRect(x * height, y * height, height, height);
}

function deathMessage() {
    var deathImage = new Image(540, 540);
    deathImage.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        deathAudio.play(); 
        canvas.width = deathImage.width;
        canvas.height = deathImage.height;
        ctx.drawImage(deathImage, 0, 0);
    }
    deathImage.src = MEDIA_PATH + "lose.gif";
}

function winMessage() {
    var winImage = new Image(540, 540);
    winImage.onload = function () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        winAudio.play();
        canvas.width = winImage.width;
        canvas.height = winImage.height;
        ctx.drawImage(winImage, 0, 0);
    }
    winImage.src = MEDIA_PATH + "win.gif";
}