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
    };

    var scoreAndStartChain = function() {
        scores += chainscores;
        prevscores = 1;
        chainscores = 1;
    };

    var circleClicked = function (evt) {
        if (clicks > 0 && this.$.contains(evt.pos)) {
            this.dead = true;
            scoreAndStartChain();
	}
    };

    var explodeDead = function(time) {
        if (this._.dead) {
            var exp = b(explosion);
            exp.v.state.x = this.x;
            exp.v.state.y = this.y;
            exp.band([time, Number.MAX_VALUE]);
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
            .modify(afterFrame(1, updateSpeed))
            .on(C.X_MCLICK, doIf(inState("game"), circleClicked));

    var explosion = b("explosion").circle([0, 0], RADIUS)
            .nostroke()
            .fill("#fff")
            .xscale([0, 2], [1, 6], C.E_BINOUT)
            .alpha([2, 3], [1, 0], C.E_BIN)
            .modify(function(t){
                if (t > 3) {
                    this.$.parent.remove(this.$);
                }
            });

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
                if (explosions[i].intersects(circles[j])) {
                    circles[j].state.dead = true;
                    scoreExplosion();
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
		.modify(doIf(inState("game"), detectCollisions));
        var counter = 42-(2*n);
        while (counter -- > 0) {
	    level.add(b(circle_thingy).fill(fhsv(Math.random(), 0.7, 1, 1)));
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

    var levelHolder = b("holder");
    gameScreen
        .add(levelHolder)
        .add(clicksHUD)
        .add(scoreHUD)
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
        clicksHUD.v.xdata.text.lines = "Clicks: " + clicks;
        var newLevel = b(currentLevelTemplate.level);
        if (activeLevel) levelHolder.remove(activeLevel);
        levelHolder.add(newLevel);
        activeLevel = newLevel;
    };
    var player = createPlayer('gameCanvas', {'mode':C.M_DYNAMIC, 'cnvs':{"bgfill": { color: "#000" },'width':WIDTH, 'height':HEIGHT}});
    player.load(scene).play();
}