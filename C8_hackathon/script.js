/*********************************************** DOCUMENT.READY *****************************************/
$(document).ready(function () {
    //hiding all other wrappers beside the landing page
    $('#read, #watch, #listen, #error, #selectNext, #selectPrev, #startOverBtn, #music-background, #music-background-cover, #twitter-share-button').hide();

    loadNouns();

    autocomplete();

    randomizeOptions();

   // $("#nowButton").click(nowClicked);
    $("#nowButton").on("click", function(){
        nowClicked();
    });

    $("#startOverBtn").click(function () {
        // console.log('clicked');
        iWant.queueArray = [];
        iWant.index = 0;

        $("#watch").html('<iframe id="ytplayer" width="854" height="480" src="" frameborder="0"></iframe>');

        $("#audio").attr("src", "");
        
        $('#read, #watch, #listen, #error, #selectNext, #selectPrev, #startOverBtn, #music-background, #music-background-cover, #twitter-share-button').hide();
        $('#landing').show();

        randomizeOptions();

    });

    $("#random-btn").click(randomizeOptions);

    $(window).unload(nounStorage);

    $('#selectNext').click(next);
    $('#selectPrev').click(prev);

    $('input[type=text]').blur(function(){
            $('.placeholder').removeClass("placeholder--animate");
            $('.border').removeClass("border--animate");

            checkInput();
        })
        .focus(function() {
            $('.placeholder').addClass("placeholder--animate");
            $('.border').addClass("border--animate");
            checkInput();
        });
    //enter selects "now" but only if landing is visible
    $(document).keypress(function(e) {
        if(e.which == 13) {

                nowClicked();
            
        }
    });

});//////end of document.ready

/*********************************************** GLOBAL VARIABLES *****************************************/

/**
 * iWant - main object
 * @type {{verbArray: string[], nounArray: string[], queueArray: Array, index: number, selectedVerb: null, selectedNoun: null, secretI: number, interval: null}}
 */
var iWant = {
    verbArray: ["read", "listen to", "watch"],
    nounArray: ["cats", "dogs", "space", "nature", "cars", "football", "politics", "comics", "robots", "horses", "science", "ghosts", "Disney", "America", "England", "Japan", "the ocean", "fire", "blues", "hip hop", "basketball", "fashion", "babies", "cute baby animals", "technology", "sloths", "magic", "otters", "bacon", "mysteries"],
    queueArray: [],
    index: 0,
    selectedVerb: null,
    selectedNoun: null,
    secretI: 1,
    interval: null
};

/********************************** LANDING PAGE FUNCTIONS ************************************************/

/**
 * randomizeOptions - randomizeOptions function for randomizing verbs and nouns in landing page
 */
function randomizeOptions() {
    var randomVerb = iWant.verbArray[generateRandomNumber(iWant.verbArray.length)];
    var randomNoun = iWant.nounArray[generateRandomNumber(iWant.nounArray.length)];
    displayOptions(randomVerb, randomNoun);
}

/**
 * generateRandomNumber - this function generates a random number to be used in randomize options
 * @param length {number}
 * @return {number}
 */
function generateRandomNumber(length) {
    return Math.floor(Math.random() * length);
}

/**
 * displayOptions - this function generates a random number to be used in randomize options
 * @params {string, string}
 */
function displayOptions(randomVerb, randomNoun) {
    $("#nounInput").val(randomNoun);

    switch (randomVerb){
        case "listen to": $("#verbSelect").val('listen');
            break;
        case "watch": $("#verbSelect").val('watch');
            break;
        case "read": $("#verbSelect").val('read');
            break;
    }
}

/**
 * nowClicked - calls correct ajax call based on the verb chosen
 */
function nowClicked() {
    iWant.selectedNoun = $("#nounInput").val();
    iWant.selectedVerb = $("#verbSelect").val();

    if (iWant.selectedNoun == 'shane'){
        secret();
    } else {
        if (iWant.nounArray.indexOf(iWant.selectedNoun) == -1){
            iWant.nounArray.push(iWant.selectedNoun);
        }

        switch (iWant.selectedVerb) {
            case "read":
                readAjax();
                break;
            case "listen":
                listenAjax();
                break;
            case "watch":
                watchAjax();
                break;
        }

    }
}

/**
 * checkInput - generates css on input field
 */
function checkInput() {
    if ( $('input[type=text]').val()) {
        $('.placeholder').css('display', 'none');
    } else {
        $('.placeholder').css('display', 'visible');
    }
}

/**************************************** AJAX CALLS ********************************************************/

/****************** READ AJAX ****************************/

/**
 * readAjax - pulling text of tweets from twitter api, and creating object with username, and text of tweet
 */
function readAjax() {
    $.ajax({
        dataType: 'json',
        data: {
            search_term: iWant.selectedNoun
        },
        method: 'post',
        url: 'http://s-apis.learningfuze.com/hackathon/twitter/index.php',
        success: function (result) {
            for (i = 0; i < result.tweets.statuses.length; i++) {
                var tweet = result.tweets.statuses[i];

                var username = tweet.user.screen_name;
                var text = tweet.text;
                var name = tweet.user.name;
                var avatarUrl = tweet.user.profile_image_url_https;
                var retweets = tweet.retweet_count;
                var favorites = tweet.favorite_count;

                var tweet_object = {
                    'avatarUrl': avatarUrl,
                    'name': name,
                    'userName': '@' + username,
                    'text': text,
                    'retweets': retweets,
                    'favorites': favorites
                };

                iWant.queueArray.push(tweet_object);
            }
            displayRead();
        }
    })
}

/****************** WATCH AJAX ***************************/

/**
 * watchAjax - calls youtube API using search criteria, returns array of video objects containing title and ID of each. Returns max 50 results.
 */
function watchAjax() {
    $.ajax({

        dataType: 'json',
        data: {
            q: iWant.selectedNoun,
            maxResults: 50
        },
        method: 'POST',
        url: "http://s-apis.learningfuze.com/hackathon/youtube/search.php",
        success: function (response) {
            if (response.success) {
                // console.log("watch", response);
                //push response into resultsArray
                for (i = 0; i < response.video.length; i++) {
                    iWant.queueArray.push(response.video[i]);
                }
                // console.log("results array", iWant.queueArray);

                //call display function
                displayWatch();

                // return results array
                return response;
            } else {
                // console.log(response);
                displayError(watch);
                //return error message
            }
        }

    });
}
/****************** LISTEN TO ***********************/

/**
 * listenAjax - calls iTunes API using search criteria, returns array of
 */
function listenAjax() {
    //calls query with music as only criteria first

    $.ajax({
        url: 'https://api.spotify.com/v1/search',
        data: {
            q: iWant.selectedNoun,
            type: 'track'
        },

        success: function (response) {
            // console.log('spotify', response);


            for (i = 0; i < response.tracks.items.length; i++) {

                var tracks = response.tracks.items[i];

                var song = {
                    artist: tracks.artists[0].name,
                    album: tracks.album.name,
                    title: tracks.name,
                    picture: tracks.album.images[0].url,
                    audio: tracks.preview_url,
                    link: tracks.external_urls.spotify
                };

                iWant.queueArray.push(song);
            }

            displayListen();


        }
    });
}

/**************************************** Display Functions ********************************************************/


/******************DISPLAY READ ****************************/

/**
 * displayRead - takes the values of each object in the queueArray and injects them into the DOM
 */
function displayRead() {
    $('#landing').hide();
    $('#read, #selectNext, #selectPrev, #startOverBtn, #twitter-share-button').show();

    var j = 0;

    for (var i = iWant.index; i < iWant.index + 3; i++) {
        var tweet = iWant.queueArray[i];
        var tweetdiv = '#tweet' + (j + 1);
        var avatar = tweetdiv + ' .avatar';
        var text = tweetdiv + ' .text';
        var name = tweetdiv + ' .name';
        var userName = tweetdiv + ' .userName';
        var retweets = tweetdiv + ' .retweets';
        var favorites = tweetdiv + ' .favorites';

        $(avatar).attr('src', tweet.avatarUrl);
        $(text).text(tweet.text);
        $(name).text(tweet.name);
        $(userName).text(tweet.userName);
        $(retweets).text(tweet.retweets);
        $(favorites).text(tweet.favorites);

        j++;
    }

    iWant.index += 3;

    if (iWant.index >= 15) {
        iWant.index = 0;
    }
}

/******************DISPLAY WATCH ***************************/

/**
 * displayWatch - inputs video ID from queue array into iframe src to play video
 */

function displayWatch() {

    var id = iWant.queueArray[iWant.index].id;
    $("#ytplayer").attr("src", "http://www.youtube.com/embed/" + id + "?autoplay=1");

    $('#landing').hide();
    $('#watch, #selectNext, #selectPrev, #startOverBtn, #twitter-share-button').show();


    iWant.index++;
}

/******************DISPLAY LISTEN TO ***********************/

/**
 * displayListen - pulls a random song/podcast out of the queueArray and displays that item in the listen element of the page
 */
function displayListen() {
    $("#landing").hide();
    $("#listen, #selectNext, #selectPrev, #startOverBtn, #music-background, #music-background-cover, #twitter-share-button").show();

    var background = 'url(' +iWant.queueArray[iWant.index].picture + ')';
    $('#music-background').css('background-image', background);



    var obj = iWant.queueArray;
    var ind = iWant.index;
    $("#pic").attr("src", iWant.queueArray[iWant.index].picture);
    $("#artistName").html('<span class="track-info glyphicon glyphicon-user"></span><span>' + obj[ind].artist + '</span>');
    $("#albumName").html('<i class="track-info material-icons">album</i><span>' + obj[ind].album + '</span>');
    $("#songName").html('<span class="track-info glyphicon glyphicon-music"></span><span>' + obj[ind].title + '</span>');
    $("#linkForAudio").attr("href", obj[ind].link).attr('target','_blank');
    $("#audio").attr("src", obj[ind].audio);
    $("#audio")[0].play();
    iWant.index += 1;
}

/******************DISPLAY ERROR ***********************/

/**
 * displayError - If it is called for something other than an ajax fail message, it will display the default please try again, otherwise it will display a message specific to the server failure
 * @param verb {string} - either read, listen, or watch depending on which ajax call is calling the function
 */
function displayError(verb) {
    $('#landing, #read, #listen, #watch').hide();
    $('#error, #startOverBtn').show();
    var error_div = $('#error div');

    switch (verb) {
        case 'read':
            error_div.text('Twitter cannot be reached. Please try again');
            break;
        case 'watch':
            error_div.text('YouTube cannot be reached. Please try again');
            break;
        case 'listen':
            error_div.text('iTunes cannot be reached. Please try again');
            break;
    }
}

/**
 * next - when next arrow is clicked, it calls the display function for the appropriate verb
 */
function next() {
    switch (iWant.selectedVerb) {
        case "read":
            displayRead();
            break;
        case "listen":
            displayListen();
            break;
        case "watch":
            displayWatch();
            break;
    }
}

/**
 * prev - when previous arrow is clicked, it decremenets the index to the appropriate number according to the current verb
 */
function prev() {
    if (iWant.selectedVerb == 'read') {
        if (iWant.index >= 6) {
            iWant.index -= 6;
        }
        else {
            iWant.index = 12;
        }
    }
    else {
        if (iWant.index > 0) {
            iWant.index -= 2;
        }
    }
    next();
}

/**
 * autocomplete - sets datalist with autocomplete options
 */
function autocomplete() {
    for (var i = 0; i < iWant.nounArray.length; i++) {
        var option = $("<option>").val(iWant.nounArray[i]);
        $("#noun-list").append(option);
    }
}

/**
 * nounStorage - function to store noun array in local storage
 * @return {string}
 */
function nounStorage() {
    var storage = {
        'nouns': iWant.nounArray
    };

    var nouns = JSON.stringify(storage);

    window.localStorage.setItem('nouns', nouns);
    return nouns;
}

/**
 * loadNouns - function to load stored nouns
 * @return {Array}
 */
function loadNouns() {
    var nouns = window.localStorage.getItem('nouns');
    if(nouns != null){
        var nounStorage = JSON.parse(nouns);
        iWant.nounArray = nounStorage.nouns;
    }
    // return nounStorage.nouns;
}

/******************************************************** Top Secret ********************************************************/

/**
 * secretDOMObj - create something secret
 * @params {number, number, number}
 */
function secretDOMObj() {
    var i = iWant.secretI;
    if (i < 23) {
        var top = Math.round(Math.random() * 200);
        var left = Math.round(Math.random() * 800);

        var dialog = $("<div>").addClass('modal-dialog modal-lg secret');
        var content = $("<div>").addClass('modal-content');
        var header = $("<div>").addClass('modal-header');
        var body = $("<div>").addClass('modal-body');
        var footer = $("<div>").addClass('modal-footer');
        var image = $("<img>").attr("src", "image/top-secret/" + i + ".jpg").addClass('secret-image');
        var close = $("<button>").attr({
            "type": "button",
            "data-dismiss": "modal"
        }).addClass("btn btn-default").text("Close");
        var title = $("<h4>").addClass('modal-title').text("Modal Model");

        $(header).append(title);
        $(body).append(image);
        $(footer).append(close);
        $(content).append(header, body, footer);
        $(dialog).append(content).offset({'top': top, 'left': left});
        $('body').append(dialog);

        iWant.secretI++;
    } else {
        clearInterval(iWant.interval);
    }
}

/**
 * secret - interval creating secret objects
 */
function secret() {
    $("#audio").attr("src", "audio/top-secret-song.mp3");
    $("#audio")[0].play();
    iWant.interval = setInterval(secretDOMObj, 300);
}

