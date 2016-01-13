// GAME COLLECTION
Games = new Mongo.Collection("games");

// LEADERBOARD COLLECTION FOR COUNTING USER-SCORE DATA
Leaderboard = new Mongo.Collection("leaderboard");

// CLIENT-SIDE
if (Meteor.isClient) {
    
    // SET BASIC ROUTING FOR GAME MENU NAVIGATION
    Session.setDefault('isCreateGame', false);
    Session.setDefault('isJoinGame', false);
    Session.setDefault('isPlayGame', false);
    Session.setDefault('isShowLeaderboard', false);
    Session.setDefault('playerWeapon', '');
    Session.setDefault('gameId', 0);
    
    // SALUTE USER IF LOGGED IN, 'GUEST' IF NOT LOGGED IN
    Template.welcome.helpers({
  	 uname: function() {
         if(!Meteor.userId()) {
             return 'Guest';
            } else {
                return Meteor.user().username;
            }
        }
    });
    
    // REACT TO NAVIGATION MENU BUTTON CLICKS
    Template.playground.helpers({
        isCreateGame: function() { // USER WANTS TO CREATE NEW GAME
            var show = Session.get('isCreateGame');
            if(show === true) {
                return true;
            } else {
                return false;
            }
        },
        
        isJoinGame: function() { // USER WANTS TO JOIN A GAME
            var show = Session.get('isJoinGame');
            if(show === true) {
                return true;
            } else {
                return false;
            }
        },
        
        isPlayGame: function() { // USER WANTS TO PLAY A GAME
            var show = Session.get('isPlayGame');
            if(show === true) {
                return true;
            } else {
                return false;
            }
        },
        
        isShowLeaderboard: function() { // USER WANTS TO SEE LEADERBOARD
            var show = Session.get('isShowLeaderboard');
            if(show === true) {
                return true;
            } else {
                return false;
            }
        }
    });
    
    // REMOVE SELECTED ITEMS AFTER REFRESH
    Template.playground.destroyed = function(){
        Session.set('isCreateGame', false);
        Session.set('isJoinGame', false);
        Session.set('isPlayGame', false);
        Session.set('isShowLeaderboard', false);
        //Session.set('playerWeapon', '');
    }
    
    // REGISTER CLICK EVENTS AND LISTEN THEM
    Template.header.events({
        "click .create-game": function() { // USER CLICKED CREATE GAME BUTTON
            Session.set('isCreateGame', true);
            Session.set('isJoinGame', false);
            Session.set('isPlayGame', false);
            Session.set('isShowLeaderboard', false);
        },
        
        "click .join-game": function() { // USER CLICKED JOIN GAME BUTTON
            Session.set('isJoinGame', true);
            Session.set('isCreateGame', false);
            Session.set('isPlayGame', false);
            Session.set('isShowLeaderboard', false);
        },
        
        "click .leaderboard": function() { // USER CLICKED SHOW LEADERBOARD BUTTON
            Session.set('isJoinGame', false);
            Session.set('isCreateGame', false);
            Session.set('isPlayGame', false);
            Session.set('isShowLeaderboard', true);
        }
    });
    
    // JOINGAME TEMPLATE HELPERS
    Template.joinGame.helpers({
        games: function() { // LIST ALL(FINISHED-WAITING-PLAYING) GAMES
            
            return Games.find({});
        },
        
        gamesCount: function() { // COUNT ALL(FINISHED-WAITING-PLAYING) GAMES
            return Games.find({}).count();
        }
    });
    
    // CREATEGAME TEMPLATE EVENTS
    Template.createGame.events({
        'submit form': function(event) { // USER SUBMITTED CREATE NEW GAME FORM
            event.preventDefault();
            
            var gameNameVar = event.target.gamenameinput.value; // get game name
            
            Meteor.call("createGame", gameNameVar); // call createGame function (safe to use like that)
            
            event.target.gamenameinput.value = "";
            
            Session.set('isPlayGame', false);
            Session.set('isCreateGame', false);
            Session.set('isJoinGame', true);
            Session.set('playerWeapon', 'x'); // set creators weapon to 'x'
        }
    });
    
    // LEADERBOARD TEMPLATE HELPERS
    Template.leaderboard.helpers({
        scores: function() { // LIST ALL USERS SCORES DESCENDING
            return Leaderboard.find({}, {sort: {score: -1}});
        },
        
        userCount: function() { // COUNT ALL USER WHO HAVE PLAYED A GAME
            return Leaderboard.find({}).count();
        }
    });
    
    // GAME TEMPLATE HELPERS
    Template.game.helpers({
        isPlayerJoined: function() { // PLAYER JOINED THE GAME
            var game = Games.findOne(this._id);
            
            if(game.player1 === Meteor.user().username || game.player2 === Meteor.user().username) {
                return true;
            } else {
                return false;
            }
        },
        
        isOwner: function() { // IS PLAYER CREATED THE GAME?
            var game = Games.findOne(this._id);
            
            if(game.owner === Meteor.userId()) {
                return true;
            } else {
                return false;
            }
        },
        
        isFinished: function() { // IS THE GAME FINISHED?
            var game = Games.findOne(this._id);
            
            return game.finished;
        },
        
        isGameNotPlaying: function() { // DO NOT SHOW JOIN BUTTON IF PLAYER 2 JOINED THE GAME
            var game = Games.findOne(this._id);
            
            if(game.player2 != "UNKNOWN") {
                return false;
            } else {
                return true;
            }
        }
    });
    
    // GAME TEMPLATE EVENTS
    Template.game.events({
        "click .delete": function() { // USER WANTS TO DELETE OWNED GAME
            Meteor.call("deleteGame", this._id, Meteor.userId());
        },
        
         "click .join": function() { // USER WANTS TO JOIN A GAME CREATED BY OTHER USER
            Meteor.call("joinGame", this._id, Meteor.userId());
            Session.set('playerWeapon', 'o');
        },
        
         "click .play": function() { // USER WANTS TO START THE GAME
            Session.set('gameId', this._id);
            
            var game = Games.findOne(Session.get('gameId'));
            
            if(game.owner === Meteor.userId()) {
                Session.set('playerWeapon', 'x');
            } else {
                Session.set('playerWeapon', 'o');
            }
             
            Session.set('isCreateGame', false);
            Session.set('isJoinGame', false);
            Session.set('isPlayGame', true);
        }         
        
    });
    
    // PLAYGAME TEMPLATE HELPERS
    Template.playGame.helpers({
        
        currentGame: function() { // RETURNS CURRENT GAME FOR USING IT IN TEMPLATE
            var game = Games.findOne(Session.get('gameId'));
            
            if(game.player2 === "UNKNOWN") { // CHECK PLAYER2 IS JOINED TO GAME
                game.isPlayer2NotConnected = true;
            } else {
                game.isPlayer2NotConnected = false;
            }
            return game;           
        },
        
        isYourTurn: function() { // RETURNS TRUE IF CLIENTS TURN
            var game = Games.findOne(Session.get('gameId'));
            
            if(game.turns === Session.get('playerWeapon')) {
                return true;
            } else {
                return false;
            }
        }

    });
    
  
  	// CREATE ACCOUNTS AND LOGIN SYSTEM WITH METEOR'S PACKAGE
    Accounts.ui.config({
  		passwordSignupFields: "USERNAME_ONLY"
  	});

    // GAMEBOARD TEMPLATE EVENTS
    Template.gameBoard.events({
      'click .movement.available' : function(e){ // MOVEMENT CONTROLS AND OPERATIONS ON THE GAMEBOARD
          
        var game = Games.findOne(Session.get('gameId'));
        
        if(game.player2 === "UNKNOWN") { // PLAYER 1 MUST WAIT PLAYER 2 TO START PLAYING
            throw new Meteor.Error("Wait for player 2!");
        } else {
            
            if(game.turns === Session.get('playerWeapon')) { // PLAYERS CAN ONLY PLAY WITH OWNED WEAPONS
                cell = $(e.target);

                cell.removeClass("available");

                var col = cell.parent().attr("data-col")

                var game = Games.findOne(Session.get('gameId'));
                turn = game.turns;

                cell.children().addClass("move-" + turn); // DISPLAY NEW MOVE ON BOARD
 
                Meteor.call("updateCell", Session.get('gameId'), col, turn); // UPDATE CELL OBJECT

                Meteor.call("updateTurn", Session.get('gameId')); // UPDATE TURN

                
                // WIN-DRAW
                var winner = findWinner(Session.get('gameId')); // FINDWINNER FUNCTION COMPARES WINNING POSITIONS WITH CURRENT PLAYER POSITIONS
                
                if (winner.length > 1) { // IF SOMEBODY WON THE GAME
                    $(".available").removeClass("available"); // FREEZE THE BOARD

                    var game = Games.findOne(Session.get('gameId'));
                    cells = game.cells;

                    cells[winner[0]].winner = true;
                    cells[winner[1]].winner = true;
                    cells[winner[2]].winner = true;
                    
                    // get which weapon won
                    wonWeapon = cells[winner[0]].move;
                    
                    Games.update(Session.get('gameId'), { $set: {cells: cells} }); // update cells for won cell positions
                    Games.update(Session.get('gameId'), { $set: {finished: true} }); // set game finished 
                    
                    var wonPlayer = '';
                    
                    if(wonWeapon == "x") { // decide who wins
                        wonPlayer = game.player1;  
                    } else {
                        wonPlayer = game.player2;
                    }
                    
                    Games.update(Session.get('gameId'), { $set: {winner: wonPlayer} }); // update winner on the game
                    
                    // IF WIN +5 POINTS
                    // IF DRAW 0 POINTS
                    // IF LOSS 0 POINTS
                    var player = Leaderboard.findOne({username: wonPlayer});
                    var score = player.score + 5;
                    
                    // update player on the leaderboard.
                    Leaderboard.update(player._id, {$set: {score: score}});
                    
                } else if(winner.length == 1) { // IF GAME IS DRAW
                    
                    $(".available").removeClass("available"); // FREEZE THE BOARD
                    
                    var game = Games.findOne(Session.get('gameId')); 
                    cells = game.cells;
                    
                    for(var i = 0; i < 9; i++) {
                        cells[i].winner = true;
                    }
                    
                    Games.update(Session.get('gameId'), { $set: {cells: cells} }); // update cells freeze
                    Games.update(Session.get('gameId'), { $set: {finished: true} }); // set finished
                    Games.update(Session.get('gameId'), { $set: {winner: 'DRAW!'} }); // set winner to DRAW
                    
                }
                // # WIN-DRAW
                
            } else {
                throw new Meteor.Error("Wait for your turn!"); // FOR DEBUGGING
            }
                  
        }
      }
    });
    
    // GAMEBOARD TEMPLATE HELPERS
    Template.gameBoard.helpers({
        cells: function() { // GET ALL CELLS FROM GAMES COLLECTION
            var game = Games.findOne(Session.get('gameId'));
            
            return game.cells; 
        }
    });
}

// CREATE METHODS FOR MONGODB CRUD
Meteor.methods({
    
    createGame: function(gameName) { // INSERT GAME TO GAMES COLLECTION
    
        var cells = [];
        var cell = {};

        for (var i = 0; i < 9; i++) { // CREATE BOARD
            cell.move = '';
            cell.winner = false;
            cell.index = i;
            
            cells.push(cell);
        }
        
        Games.insert({ // CREATE GAME WITH INPUTS & CREATED BOARD
            gameName: gameName,
            createdAt: new Date(),
            owner: Meteor.userId(),
            player1: Meteor.user().username,
            player2: 'UNKNOWN',
            turns: 'x',
            cells: cells,
            finished: false,
            winner: ''
        });
        
        // create leaderboard entries for player on first game, if player not exists in leaderboard
        var user = Leaderboard.findOne({username: Meteor.user().username}); 
        
        if(!user) {
            Leaderboard.insert({
                username: Meteor.user().username,
                score: 0
            });
        }
    },
    
    deleteGame: function(gameId, user) { // USER WANTS TO DELETE OWNED GAME
        var game = Games.findOne(gameId);
        
        if(game.owner === user) {
            Games.remove(gameId);
        } else {
            throw new Meteor.Error("You cannot delete other players games."); // FOR DEBUGGING
        }
        
    },
    
    joinGame: function(gameId, user) { // USER WANTS TO JOIN CREATED GAME
        
        var game = Games.findOne(gameId);
        
        if(game.player2 === "UNKNOWN") {
            if(game.owner !== user) {
                Games.update(gameId, { $set: {player2: Meteor.user().username} });
                
            // create leaderboard entries for player on first game, if player not exists in leaderboard
            var user = Leaderboard.findOne({username: Meteor.user().username});
        
            if(!user) {
                Leaderboard.insert({
                    username: Meteor.user().username,
                    score: 0
                });
            }
                
            } else {
                throw new Meteor.Error("You cannot join your own game.");
            }           
        } else {
            throw new Meteor.Error("This game is full!");
        }
    },
    
    // game methods
    updateTurn: function(gameId) { // UPDATE GAME TURN ON THE DATABASE
        var game = Games.findOne(gameId);
        
        if(game.turns === "x") {
            Games.update(gameId, { $set: {turns: "o"} });
        } else {
            Games.update(gameId, { $set: {turns: "x"} });
        }
    },
    
    updateCell: function(gameId, rowcol, move) { // UPDATE NEW MOVES ON THE DATABASE
        var game = Games.findOne(gameId);
        
        var cells = game.cells;
        
        cells[rowcol].move = move;
        
        Games.update(gameId, { $set: {cells: cells} });
    }

});

// NOTHING NEEDED TO RUN ON SERVER
if (Meteor.isServer) {
    
    Meteor.startup(function () {
        
    });
}

// FINDS WINNER BY COMPARING WINNING POSITIONS WITH CURRENT(GIVEN) BOARD
var findWinner = function(gameId) {
    var game = Games.findOne(gameId);
    cells = game.cells;
        
    winner = []
    
    // yana dogru
    if((cells[0].move != '' && cells[1].move != '' && cells[2].move != '') && (cells[0].move === cells[1].move && cells[1].move === cells[2].move && cells[0].move === cells[2].move)) {
        winner = [0, 1, 2];
    } else if((cells[3].move != '' && cells[4].move != '' && cells[5].move != '') && (cells[3].move === cells[4].move && cells[5].move === cells[4].move && cells[5].move === cells[3].move)) {
        winner = [3, 4, 5];
    } else if((cells[6].move != '' && cells[7].move != '' && cells[8].move != '') && (cells[6].move === cells[7].move && cells[7].move === cells[8].move && cells[6].move === cells[8].move)) {
        winner = [6, 7, 8];
    // asagiya dogru   
    } else if((cells[0].move != '' && cells[3].move != '' && cells[6].move != '') && (cells[0].move === cells[3].move && cells[3].move === cells[6].move && cells[0].move === cells[6].move)) {
        winner = [0, 3, 6];
    } else if((cells[1].move != '' && cells[4].move != '' && cells[7].move != '') && (cells[1].move === cells[4].move && cells[7].move === cells[4].move && cells[1].move === cells[7].move)) {
        winner = [1, 4, 7];
    } else if((cells[2].move != '' && cells[5].move != '' && cells[8].move != '') && (cells[2].move === cells[5].move && cells[8].move === cells[2].move && cells[5].move === cells[8].move)) {
        winner = [2, 5, 8];
    // capraz
    } else if((cells[0].move != '' && cells[4].move != '' && cells[8].move != '') && (cells[0].move === cells[4].move && cells[4].move === cells[8].move && cells[0].move === cells[0].move)) {
        winner = [0, 4, 8];
    } else if((cells[2].move != '' && cells[4].move != '' && cells[6].move != '') && (cells[2].move === cells[4].move && cells[4].move === cells[6].move && cells[6].move === cells[2].move)) {
        winner = [2, 4, 6];
    // draw
    } else if(cells[0].move != '' && cells[1].move != '' && cells[2].move != '' && cells[3].move != '' && cells[4].move != '' && cells[5].move != '' && cells[6].move != '' && cells[7].move != '' && cells[8].move != '') {
        winner = [1];      
    } else {
        winner = [];          
    }
    
    return winner;
};
