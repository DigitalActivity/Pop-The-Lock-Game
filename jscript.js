/***
* Projet : TP2 Developpement Web
*
* Description : Pick the Lock Game en Javascript
* Author : Younes Rabdi 0821450
* Date : 26/10/2017
***/

/**
* PickTheLock, constructeur du jeu
*/
function PickTheLock(p_canvas) {
	var MIN_DISTANCE = 90; // distance min en degrés entre le marqueur du cadnas et le petit cercle
	var TEXT_SIZE = 36;
	var TEXT_FONT = TEXT_SIZE + "pt Georgia";
	var TEXT_COLOR = "#000000";
	var VITESSE_ROTATION = 2;
	var donutDeg = 0; // Degré de rotation du cadnas
	var cercleDeg = 0; // Degré de rotation du petit cerle 
	var clockwise = true; // Direction de rotation
	var level = 1; // nombre de Pickups que le joueur doit effectuer avant de passer au niveau prochain
	var nombrePickups = 0; // nombre de Pickups effectuées dans un level
	var keyDownWrongTime = false; // true quand le joueur pèse sur la touche au mauvais moment
	var hasWin = false; // true quand le joueur passe au niveau suivant
  	var canv = p_canvas;
	var ctx;
  	if (canv.getContext('2d')) {
      	ctx = canv.getContext('2d');
  	}
    else return;

	// Le jeu commence ici
	this.startGame = function() {
		// Initialiser le style du texte
		ctx.fillStyle = TEXT_COLOR;
		ctx.font = TEXT_FONT;
		// initialiser la position du top du cadenas
		magnet.posDebutDessin = - donut.outterRadius - 40;
		magnet.radiusDessin = donut.outterRadius/2;
		magnet.widthLine = donut.outterRadius/3;
		// Positionner le cerle cible sur le contour du cadnas
		ball.radius = Math.round((donut.outterRadius - donut.innerRadius) / 3); // taille selon le contour du cadnas
		ball.y -= donut.innerRadius + ball.radius * 1.5; // postionner cerle sur le contour du cadnas
		ball.x -= ball.radius;
		// Dessiner le jeu sans commencer la rotation
		dessinerJeu();
		// Activer event listner keydown pour commencer la rotation
		keydownListnerToStartRotation(true); // startLoop onClique
		keydownListnerToPickup(false);
	};

	// Ajuster des parametres ensuite lancer la boucle du jeu
	var startLoop = function() {
		keyDownWrongTime = false;
		// Definir une direction au hasard
		clockwise = utileGetRandom(0, 4) > 2;
		// Definir la position aleatoire du candnas en rotation
		donutDeg = utileGetRandom( 0, 360);
		// Definir la position aleatoire du cercle à atteindre
		definirPositionCercle();
		// ajuster EventKeydown listners
		keydownListnerToStartRotation(false);
		keydownListnerToPickup(true);
		// Commencer la boucle du jeu
		gameLoop();
	};
 
	// La boucle principale du jeu
	var gameLoop = function() {
		incrementerDegresDeRotation();
		dessinerJeu();

		// Verifier si win et afficher l'animation correspondante
		if (hasWin) {
			hasWin = false;
			animationWin();
			return;
		}

		// repeter tant que le level n'est pas atteint et que le keyDown n'est pas effectué au mauvais moment
		if (!keyDownWrongTime && nombrePickups <= level) {
				window.requestAnimationFrame(gameLoop);
		} else {
			keydownListnerToStartRotation(true);
			keydownListnerToPickup(false);
		}

		// verifier si trop tard
		if(isTooLate.verifier()) {
			eventLost();
		}
	};

	// Incrementer/Decrementer le degres de rotation selon direction
	var incrementerDegresDeRotation = function() {
		if (clockwise) {
			donutDeg += VITESSE_ROTATION;
			/*if (donutDeg >= 360) 
				donutDeg = 0;*/
		} else {
			donutDeg -= VITESSE_ROTATION;
			/*if (donutDeg <= 0) 
				donutDeg = 360;*/
		}
	};
	
	// Verifier si la position du cadnas est sur le cercle.
	var isUnlockPosition = function(p_offset) {
		return distance(cercleDeg, donutDeg) <= p_offset; // p_offset est la distance acceptable (ici le radius de la ball cible)
	};

	// Definir la position aleatoire du cercle à atteindre 
	var definirPositionCercle = function() {
		var cdegMin = normaliserAngle(donutDeg + MIN_DISTANCE); // degré minimum
		cercleDeg = utileGetRandom(cdegMin, 180 + cdegMin); // random selon le deg minimum
	};

	// Obtenir l'angle de 0 à 360 deg
	var normaliserAngle = function(p_angle) {
		if (p_angle >= 360) {
			return p_angle % 360;
		} 
		else if (p_angle < 0) {
			return 360 + p_angle;
		}
		return p_angle;
	};

	// Verifier si le joueur n'a pas pesé la touche et le cadenas depasse la cible.
	var isTooLate = {
		estEntree : false, // le curseur du cadnas est entré en contact avec la cible
		verifier : function() {
			// Si entre en contact avec la cible
			if (isUnlockPosition(ball.radius - 4)) {
				this.estEntree = true;
			} // Si fin de contact avec la cible
			else if (this.estEntree) { 
				this.estEntree = false;
				return true;
			}
			return false;
		}
	};

	// Dessiner les elements du jeu
	var dessinerJeu = function() {
		// Clear
		ctx.clearRect(0, 0, canv.width, canv.height);
		// sauvegarder etat
		ctx.save();
		// Dessiner Level : x
		ctx.fillText("Level :" + level, TEXT_SIZE/2, TEXT_SIZE + 10);
		// positionner la feuille au milieu + x
		ctx.translate(canv.width/2, canv.height/1.5);
		// Dessiner Top du Cadnas
      	magnet.draw();
		// Dessiner le Cadnas (donut)
		rotateElement(donutDeg, donut);
		// pivoter et dessiner le cercle
		rotateElement(cercleDeg + ball.radius, ball);
		// Dessiner le nombre de pickups restants pour passer au niveau suivant
      	ctx.fillText(level - nombrePickups, -TEXT_SIZE/2+3, TEXT_SIZE/2);
		// debug
		//console.log("donutDeg = " + donutDeg);
		//console.log("cercleDeg = " + cercleDeg);
		//console.log("distance : " + distance(cercleDeg, donutDeg));
		// Restaurer
		ctx.restore();
		addShadow(ctx);
	};

	// Dessiner un element en rotation
	var rotateElement = function(p_degRotation, p_element) {
		// sauvegarder etat
		ctx.save();
		// Faire une rotation
		ctx.rotate(p_degRotation * Math.PI/180);
		// Dessiner l'element
		p_element.draw();
		// Restaurer
		ctx.restore();
	};

	//Evenement keydown listeners
	// Enable/Disable Keydown pour commencer la rotation
	var keydownListnerToStartRotation = function(p_active) {
		if (p_active) {
			document.body.addEventListener('keydown', startLoop, false);
		} else {
			document.body.removeEventListener('keydown', startLoop);
		}
	};

	// Enable/Disable keydown pour unlock le cadnas
	var keydownListnerToPickup = function(p_active) {
		if (p_active) {
			document.body.addEventListener('keydown', validerEvenement, false);
		} else {
			document.body.removeEventListener('keydown', validerEvenement);
		}
	};

	// Valider si space est pesé au bon moment
	var validerEvenement = function(e_key) {
		if (e_key.keyCode != 32) {
        	return;
    	}
		// afficher la distance dans la console
		console.log("distance : " + distance(cercleDeg, donutDeg));
		// verifier si le curseur du cadnas est sur la cible.
    	if (isUnlockPosition(ball.radius - 2)) {
    		eventWin();
    	} else {
    		eventLost();
    	}
	};

	// evenement quand le keydown est au bon moment
	var eventWin = function() {
		// Changer le sens de la rotation
		clockwise = !clockwise;
    	// prochain position du cercle à atteindre
    	definirPositionCercle();
    	// incrementer le nombre de pickups reussits
    	if(++nombrePickups == level) {
    		nombrePickups = 0;
    		hasWin = true;
    		level++;
    	}
    	isTooLate.estEntree = false;
	};

	// evenement quand le keydown est au mauvais moment
	var eventLost = function() {
		keyDownWrongTime = true;
		nombrePickups = 0;
		shake();
		isTooLate.estEntree = false;
	};

	// Animation on Win. Lever le top du cadnas puis le repositionner. pas de CSS
	var animationWin = function() {
		var y = 1;
		var goUp = true;
		// Desactiver les listeners
		keydownListnerToStartRotation(false);
		keydownListnerToPickup(false);
		// commencer la fonction qui va produire l'animation win
		animer();

		// la fonction qui va etre appellée en repetition pour produire l'animation
		function animer() {
			// Clear
			ctx.clearRect(0, 0, canv.width, canv.height);
			// sauvegarder etat
			ctx.save();
			// positionner la feuille au milieu + x
			ctx.translate(canv.width/2, canv.height/1.5);
			// positionner la feuille selon le x et y de lelevation
			ctx.translate(0, 0 - y);
			// Dessiner le Top du Cadnas
			magnet.draw();
			// Enlever l'elevation
			ctx.translate(0, y);
			// Dessiner le Cadnas (donut)
			rotateElement(donutDeg, donut);
			// Dessiner le cercle
			rotateElement(cercleDeg + ball.radius, ball); // Ajuster ici si nous changeons la taille du dunot.
			// Restaurer
			ctx.restore();
			//
			if (y <= 0) {
				keydownListnerToStartRotation(true);
				keydownListnerToPickup(false);
				ctx.fillStyle = TEXT_COLOR;
				magnet.topColor = "#778899";
				magnet.barsColor = "#708090";
				dessinerJeu();
				return;
			}

			// Go down apres 50p
			if (y >= 50) {
				goUp = false; }
			// incrémenter ou décrementer
			if (goUp) { y++; } 
			else { y--; }

			// Dessiner text Level : xyz et changer son couleur de temps en temps
			if (y % 8 === 0) { // pour ne pas changer les couleurs très vite
				ctx.fillStyle = getRandomColor();
				magnet.topColor = getRandomColor();
				magnet.barsColor = getRandomColor();
			}
			ctx.fillText("Level :" + level, TEXT_SIZE/2, TEXT_SIZE + 10);

			// Recommencer
			requestAnimationFrame(animer);
		}
	};

	// Animation Shake les elements du canvas. Pas de CSS
	var shake = function() {
		var amp = 7;     // diametre du shake
		var t = 1;       // duration du shake
		var step = 0.03; // progres step pour chaque frame
		// Desactiver les listeners
		keydownListnerToStartRotation(false);
		keydownListnerToPickup(false);
		letsShake();
		// la fonction qui va est appellé en repetition pour produire l'animation
		function letsShake() {
			var x = (Math.random() * amp * 2 - amp) * t; // random position x
			var y = (Math.random() * amp - amp*0.5) * t;
			// Clear
			ctx.clearRect(0, 0, canv.width, canv.height);
			// sauvegarder etat
			ctx.save();
			// positionner la feuille selon le x et y du shake
			ctx.translate(x, y);
			// Dessiner le Cadnas
			dessinerJeu();
			// Restaurer
			ctx.restore();
			// Ajuster le durée restante
			t -= step;
			if (t > 0) 
				requestAnimationFrame(letsShake);
			else {
				keydownListnerToStartRotation(true);
				keydownListnerToPickup(false);
				t = 1;
			}
		}
	};

	// Form Magnet : le top du cadnas
	var magnet = {
		posDebutDessin : 0,
		radiusDessin : 0,
		widthLine : 35,
		topColor : "#778899",
		barsColor : "#708090",

		draw : function() {
			// demi cercle
			ctx.strokeStyle = this.topColor;
			ctx.beginPath();
			ctx.lineWidth =	this.widthLine;
			// dessiner le top du cadnas à partir de la position du donut
			ctx.arc(0, this.posDebutDessin, this.radiusDessin, 0, Math.PI, true); 
			ctx.stroke();
			ctx.closePath();
			// pied gauche
			ctx.strokeStyle = this.barsColor;
			ctx.beginPath();
			ctx.moveTo(-this.radiusDessin, this.posDebutDessin);
			ctx.lineTo(-this.radiusDessin, -ctx.lineWidth*2);
			ctx.stroke();
			ctx.closePath();	
			// pied droit
			ctx.beginPath();
			ctx.moveTo(+this.radiusDessin, this.posDebutDessin);
			ctx.lineTo(+this.radiusDessin, -ctx.lineWidth*2);
			ctx.stroke();
			ctx.closePath();
		}

	};

	// Form Donut. Source : http://hmkcode.com/html5-canvas-draw-donut-chart/
	var donut = { 
		x: 0, y: 0, 
		outterRadius : 100,
		innerRadius : 60,
		AntiClockwise : false,
		sRadian : - Math.PI * 0.475, // commencer du top
		eRadian : Math.PI * 1.99 - (Math.PI * 0.485),
		color: '#FFA07A', 
		// Draw Donut
		draw: function() { 
			setRadialGradient(ctx, this.x, this.y, "#ECCF2D", "#F1C433", this.innerRadius, this.outterRadius);
			ctx.beginPath();
		        ctx.arc(this.x, this.y, this.outterRadius, this.sRadian, this.eRadian, this.AntiClockwise); // Outer: CCW
		        ctx.arc(this.x, this.y, this.innerRadius, this.eRadian, this.sRadian, !this.AntiClockwise); // Inner: CW
		    ctx.closePath();
		    ctx.fillStyle = this.color;              
		    ctx.fill(); 

		} 
	};

	// Form Cerle
	var ball = { 
		x: 0, y: 0, 
		radius: 10, 
		color: '#FFDC00', 
		draw: function() { 
			ctx.beginPath(); 
				ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true); 
			ctx.closePath(); 
			ctx.fillStyle = this.color; 
			ctx.fill(); 
		} 
	};
} // FIN PickTheLock

// Obtenir un random
function utileGetRandom(p_min, p_max) {
	if (!isNaN(p_min) && !isNaN(p_max) && p_max < Number.MAX_VALUE) {
		return Math.floor(Math.random() * (p_max - p_min + 1)) + p_min;
	} else {
		return Math.random();
	}
}

// add Shadow 
function addShadow(ctx) {
    ctx.shadowColor = "#696969";
    ctx.shadowBlur = 1;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

// set Radial Gradient
function setRadialGradient(ctx, x, y, sgc, bgc, innerRadius, outterRadius) {
    var grd = ctx.createRadialGradient(x, y, innerRadius + 5, x, y, outterRadius);
    grd.addColorStop(0,sgc);
    grd.addColorStop(1,bgc);
    ctx.fillStyle = grd;
}

// Generer une couleur random
// source: https://stackoverflow.com/questions/1484506/random-color-generator
function getRandomColor() {
	var letters = '0123456789ABCDEF';
	var color = '#';
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

/**
 * Length (angular) of a shortest way between two angles.
 * It will be in range [0, 180].
 * source : https://stackoverflow.com/questions/7570808/how-do-i-calculate-the-difference-of-two-angle-measures
 */
function distance(alpha, beta) {
    var phi = Math.abs(beta - alpha) % 360;       // This is either the distance or 360 - distance
    var distance = phi > 180 ? 360 - phi : phi;
    return distance;
}