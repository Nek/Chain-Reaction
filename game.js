function start() {
    anm.M.collisions.pathDriven = true;
    var b = Builder._$, C = anm.C;

    var fhsv = Builder.fhsv;

    var WIDTH = 600;
    var HEIGHT = 450;
    var RADIUS = 10;

    var state = "game";

    var inState = function (s) {return function () {return s === state;};};

    var countFrames = function () {
        if (this.currentFrame === undefined) this.currentFrame = 0;
        else this.currentFrame += 1;
    };

    var doIfThis = function (cond, l) {
        return function (t, d) {
            if (cond.call(this)) {
                return l.call(this, t, d);
            }
        };
    };

    var doIf = function (cond, l) {
        return function (t, d) {
            if (cond()) {
                return l.call(this, t, d);
            }
        };
    };

    var currentFrameEq = function (i) {
        return function () {
            return this.currentFrame === i;
        };
    };

    var currentFrameGt = function (i) {
        return function () {
            return this.currentFrame > i;
        };
    };

    var currentFrameLt = function (i) {
        return function () {
            return this.currentFrame < i;
        };
    };

    var onFrame = function (i, l) {
        return doIfThis(currentFrameEq(i), l);
    };

    var afterFrame = function (i, l) {
        return doIfThis(currentFrameGt(i), l);
    };

    var init = function (t) {
        this.dead = false;
        this.name = Math.random();
        this.x = Math.random() * (WIDTH - RADIUS * 5) + 2.5 * RADIUS;
        this.y = Math.random() * (HEIGHT - RADIUS * 5) + 2.5 * RADIUS;
        this.speed = [Math.random() > 0.3 ? 1 : -1, Math.random() > 0.3 ? 1 : -1];
    };

    var logFrame = function () {
        console.log("Current frame:", this.currentFrame);
    };

    var move = function (t) {
        if (this._.speed !== undefined) {
            this.x = this._.x + this._.speed[0];
            this.y = this._.y + this._.speed[1];
        }
    };
    var updateSpeed = function (t) {
        if (this.speed !== undefined && this._.speed !== undefined) {
            if (this.x > WIDTH) this.speed[0] = -this._.speed[0];
            if (this.x < 0) this.speed[0] = -this._.speed[0];
            if (this.y > HEIGHT) this.speed[1] = -this._.speed[1];
            if (this.y < 0) this.speed[1] = -this._.speed[1];
        }
    };

    var clicks = 3;
    var scores = 0;
    var chainscores = 0,
	prevscores = 0;


    var scoreExplosion = function() {
        var p = chainscores;
        chainscores = chainscores + prevscores;
        prevscores = p;
	return p;
    };

    var scoreAndStartChain = function() {
        scores += chainscores;
        prevscores = 1;
        chainscores = 1;
    };

    var placeBomb = function (evt, time) {
	if (clicks > 0) {
	    var exp = b(explosion);
            exp.v.state.x = evt.pos[0];
            exp.v.state.y = evt.pos[1];
            exp.band([time, Number.MAX_VALUE]);
            this.$.add(exp);
            scoreAndStartChain();
	}
    };

    var explodeDead = function(time) {
        if (this._.dead) {
            var exp = b(explosion);
            exp.v.state.x = this.x;
            exp.v.state.y = this.y;
            exp.band([time, Number.MAX_VALUE]);
	    exp.v.children[1].children[0].xdata.text.fill.color = this.$.__data.color;
	    exp.v.children[1].children[0].xdata.text.lines = "+"+this._.scores;
            this.$.parent.add(exp);
            this.$.parent.remove(this.$);
        }
    };

    var circle_thingy = b("circle thingy")
            .circle([0, 0], RADIUS)
            .nostroke()
            .modify(explodeDead)
            .modify(countFrames)
            .modify(onFrame(1, init))
            .modify(afterFrame(1, move))
            .modify(afterFrame(1, updateSpeed));
            
    var explosion = b("explosion")
	    .band([0,3.5])
            .modify(function(t){
                if (t > 3) {
                    this.$.parent.remove(this.$);
                }
            })
	    .add(
		b("circle").circle([0, 0], RADIUS)
		    .nostroke()
		    .fill("#fff")
		    .xscale([0, 2], [1, 6], C.E_BINOUT)
		    .alpha([2.2, 3], [1, 0], C.E_BIN)
	    )
	    .add(
		b("blinker")
		    .add(
			b("text").text([-3, 0], "", 16, "Arial")
			    .fill('#000')
			    .nostroke()
			    .band([0, 0.4])
			    .alpha([0,0.2], [0,1])
			    .alpha([0.2,0.4], [1,0])
			    .loop(C.R_REPEAT)
		    )
		    .alpha([0, 0.5], [0, 0])
		    .alpha([0.5, 1], [0, 1])
		    .alpha([2, 3], [1, 0], C.E_BIN)
	    ); 

    var detectCollisions = function(t) {
        var circles = [];
        var explosions = [];
        var i, j;
	var newExplosion = false;

        for (i = 0; i < this.$.children.length; i ++) {
	    var el = this.$.children[i];
	    if (el.state.dead) newExplosion = true;
            el.name === "explosion" ? explosions.push(el) : circles.push(el);
	}
	
	for (i = 0; i < explosions.length; i ++) {
            for (j = 0; j < circles.length; j ++) {
	        if (explosions[i].children[0].intersects(circles[j])) {
                    circles[j].state.dead = true;
		    circles[j].state.scores = scoreExplosion();
                }
            }
        }
	if (explosions.length === 0 && circles.length === 0) {
	    console.log("victory");
	    startNextLevel();
	}
	else 
	    if (clicks === 0 && explosions.length === 0 && circles.length > 0 && !newExplosion) {
		console.log("failure");
		restartCurrentLevel();
	    }
	else
	    console.log("game on");
    };

    var getLevelTemplate = function(n) {
        var level = b('level')
		.modify(countFrames)
		.modify(doIf(inState("game"), detectCollisions))
		.on(C.X_MCLICK, placeBomb);
        var counter = 42-(2*n);
        while (counter -- > 0) {
	    var col = fhsv(Math.random(), 0.7, 1, 1);
	    var circ = b(circle_thingy).fill(col);
	    circ.data({color:col});
	    level.add(circ);
        }
	return {level: level, clicks: 3};
    };

    var gameScreen = b('gameScreen');
    var clicksHUD = b("clicksHUD")
	    .text([WIDTH - 45,25], "Clicks: 3", 16, "Arial")
            .fill("#fff")
            .nostroke()
	    .on(C.X_MCLICK, doIf(inState("game"), function () {
		clicks = clicks - 1;
		if (clicks < 0) clicks = 0;
		this.$.xdata.text.lines = "Clicks: " + clicks;
	    }));

    var scoreHUD = b("scoreHUD")
            .text([45,25], "Score: 0", 16, "Arial")
            .fill("#fff")
            .nostroke()
            .modify(function(){
                this.$.xdata.text.lines = "Score: " + (scores + chainscores);
            });

    var levelHUD = b("levelHUD")
	    .text([WIDTH/2, 25], "Level 1", 16, "Arial")
	    .fill("#fff")
	    .nostroke()
	    .modify(function () {
		this.$.xdata.text.lines = "Level " + currentLevelNumber;
	    });

    var message = b("message")
	.text([WIDTH/2, HEIGHT/2], "!", 32, "Arial")
	.fill("#fff")
	.nostroke()
	.alpha([0,1],[0,1])
	.alpha([1,2],[1,1])
	.alpha([2,3],[1,0])
	.xscale([0,3],[0.8, 1.2])
	.modify(function (t) {
	    if (t > 3) {
                this.$.parent.remove(this.$);
            }
	});
    
    var scene = b("scene");


    var welcomeScreen = b("welcomeScreen");
    welcomeScreen
        .text([WIDTH/2, HEIGHT/2], "Click to start!", 32, "Arial")
        .fill("#fff")
        .nostroke()
        .on(C.X_MCLICK, function() {
            scene.remove(welcomeScreen);
            scene.add(gameScreen);
            startLevel(1);
        });

    scene.add(welcomeScreen);

    var showMessage = function (txt) {
	console.log(txt);
	var m = b(message);
	m.band([player.state.time, Number.MAX_VALUE]);
	m.x.text.lines = txt;
	gameScreen.add(m);
    };

    var levelHolder = b("holder");
    gameScreen
        .add(levelHolder)
        .add(clicksHUD)
        .add(scoreHUD)
	.add(levelHUD)
        .on(C.X_KPRESS, function(evt) {
            if (evt.key === 114) {
                restartCurrentLevel();
            }
            if (evt.key === 110) {
                startNextLevel();
            }
        });
    var restartCurrentLevel = function() {
        scores = scoresBeforeLevel;
        startLevel(currentLevelNumber);
    };

    var startNextLevel = function() {
        currentLevelNumber += 1;
        scoreAndStartChain();
        startLevel(currentLevelNumber);
    };

    var activeLevel;
    var currentLevelNumber = 1;
    
    var scoresBeforeLevel = 0;
    var startLevel = function (n) {
        currentLevelNumber = n;
        scoresBeforeLevel = scores;
        var currentLevelTemplate = getLevelTemplate(n);
        clicks = currentLevelTemplate.clicks;
        chainscores = 0;
        prevscores = 0;
        clicksHUD.x.text.lines = "Clicks: " + clicks;
        var newLevel = b(currentLevelTemplate.level);
        if (activeLevel) levelHolder.remove(activeLevel);
        levelHolder.add(newLevel);
        activeLevel = newLevel;
	showMessage("Level " + currentLevelNumber);
    };
    var player = createPlayer('gameCanvas', {'mode':C.M_DYNAMIC, 'anim':{"bgfill": { color: "#000" },'width':WIDTH, 'height':HEIGHT}});
    player.load(scene).play();
}
