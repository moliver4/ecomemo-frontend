const GAMESURL = "https://ecomemo-app-api.herokuapp.com/games"
const USERSURL = "https://ecomemo-app-api.herokuapp.com/users"

window.addEventListener('DOMContentLoaded', e => {

    const gameClock = document.querySelector("#game-clock")
    const loginForm = document.querySelector("#login-form")
    const cards = document.querySelectorAll('.memory-card');
    const game = document.querySelector('.memory-game')
    const logout = document.querySelector("#logout")
    const startButton = document.querySelector("#start")
    const stopButton = document.querySelector("#stop")
    const saveModal = document.querySelector("#save-game-modal")
    const leaderBoardButton = document.querySelector("#leaderboard")
    const leaderBoardModal = document.querySelector("#leaderboard-modal")
    const leaderBoardContent = document.querySelector("#leaderboard-content")
    const myGamesButton = document.querySelector("#my-games")
    const myGamesModal = document.querySelector("#games-modal")
    const myGamesContent = document.querySelector("#games-content")
    const savedGameInfo = document.querySelector("#saved-game-info")
    const deleteAccountModal = document.querySelector("#delete-modal")
    const deleteAccountButton = document.querySelector("#delete-account")
    const deleteAccountContent = document.querySelector("#delete-account-content")
    const rulesButton = document.querySelector("#rules")
    const doMoreButton = document.querySelector("#do-more")

    const closeDeleteModalX = document.querySelector("#close-delete-account")
    const closeSaveModalX = document.querySelector("#close-save-game")
    const closeLeaderboardX=document.querySelector("#close-leaderboard")
    const closeGamesX = document.querySelector("#close-games")


    cards.forEach(card => card.addEventListener('click', flipCard));
    startButton.addEventListener('click', startGame)
    stopButton.addEventListener('click', stopGame)
    logout.addEventListener('click', handleLogout)
    rulesButton.addEventListener('click', showRules)
    doMoreButton.addEventListener('click', showDoMore)

    leaderBoardButton.addEventListener('click', handleLeaderBoard)
    myGamesButton.addEventListener('click', handleMyGames)
    closeGamesX.addEventListener('click', ()=> hideModal(myGamesModal))
    closeLeaderboardX.addEventListener('click', () => hideModal(leaderBoardModal))
    closeSaveModalX.addEventListener('click', () => hideModal(saveModal)) 
    closeDeleteModalX.addEventListener('click', () => hideModal(deleteAccountModal))
    deleteAccountButton.addEventListener('click', confirmDelete)


    let usernameName;
    let userID;
    let pairs = 0;
    let clockCounter = 0;
    let timer;
    let hasFlippedCard = false;
    let officialSeconds = 0;
    let lockBoard = true; //board is locked until login/startgame
    let firstCard, secondCard;




//login stuff
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault()
        let entry = e.target.username.value
        e.target.reset()
        let body = {username: entry}
        if (entry){
            handleSignIn(body)
        } else {
            alert("Please enter a username")
        }
    })

    function handleSignIn(body) {
        fetch(`${USERSURL}`, {
            method: 'POST',
            headers: { 
                "Content-Type": "application/json", 
                "Accept": "application/json"},
            body: JSON.stringify(body)
          })
          .then(res => res.json())
          .then(data => {
            //remove this later!!
            console.log(data);
            toggleVisibility(loginForm)
            usernameName = data.username;
            userID = data.id;
            toggleVisibility(logout);
            toggleVisibility(deleteAccountButton)
            game.classList.remove('inactive')
            toggleDisable(startButton);
            toggleDisable(myGamesButton);
            lockBoard = true;
        })
    }


    function toggleVisibility(node){
        if (node.style.display == "none") {
            node.style.display = "inline"
        } else {
            node.style.display = "none"
        }
    }

// logout stuff
    function handleLogout() {
        toggleVisibility(loginForm)
        toggleVisibility(logout)
        toggleVisibility(deleteAccountButton)
        game.classList.add('inactive')
        resetInfo();
    }


    function resetInfo() {
        pairs = 0;
        officialSeconds = 0;
        usernameName = null;
        userID = null;
        clockCounter = 0;
        gameClock.innerHTML = "00:00";
        resetBoard();
        shuffle();
        lockBoard = true;
        clearInterval(timer);
        timer = 0;
        startButton.textContent = "Start Game";
        toggleDisable(startButton)
        toggleDisable(myGamesButton)
    }

//button control
    function toggleDisable(button) {
        if (button.disabled) {
            button.removeAttribute("disabled");
        } else {
            button.setAttribute("disabled", "true");
        }
    }

    function restartText(){
        if (startButton.textContent === "Start Game") {
            startButton.textContent = "Restart Game";
        } 
    }


//game


    function startGame() {

        if (!stopButton.disabled) {
            toggleDisable(stopButton)
        }
        officialSeconds = 0;
        restartText();
        pairs = 0;
        resetBoard();
        shuffle();
        clockCounter = 0;
        gameClock.innerText = "00:00";
        clearInterval(timer)
        timer = setInterval(gameClockFunction, 1000)
    }

    function stopGame() {
        clearInterval(timer)
        let timerText = gameClock.innerHTML;
        officialSeconds = calculateSeconds() //working, gives total seconds
        savedGameInfo.innerHTML = "";
        savedGameInfo.innerHTML = 
        `<div class="final-time"> 
            <h4>Yay! You Did It!</h4> 
        </div>
        <div class="ui input" id="save-game-form-div" >
            <form autocomplete="off" id="save-game-form" method="post">
                <h3>Enter a Comment Before Saving:</h3>
                <div class="comment-input-container">
                    <input id="comment-field" type="text" name="comment" placeholder="Comment">
                </div>
                <br><br>
                <input class="form-button" type="submit" value="Save My Game!">
                <br><br>
            </form>
        </div>`
        const saveGameForm = document.querySelector("#save-game-form")
        saveGameForm.addEventListener('submit', (e) => handleSubmission(e))
        displayModal(saveModal)

    }

    function handleSubmission(e) {
        e.preventDefault()
        let comment = e.target.comment.value 
        const body = {username: usernameName, "totaltime": officialSeconds, "comment": comment}
        saveGame(body)
    }

    function saveGame(body){
        fetch(`${GAMESURL}`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        })
        .then(resp => resp.json())
        .then(data => showSaved(data))
    }

    function showSaved(data) {
        console.log(data)
        toggleDisable(stopButton)
        savedGameInfo.innerHTML = "";
        savedGameInfo.innerHTML = 
        `<h4 class="game-saved">GAME  SAVED</h4>
            <div class="game-card">
                <div class="ui segments">
                    <div class="ui segment"><h6>User:</h6></div>
                    <div class="ui secondary segment"><p>${usernameName}</p></div>
                </div>
                <div class="ui segments">
                    <div class="ui segment"><h6>Time:</h6></div>
                    <div class="ui secondary segment"><p>${gameClock.innerHTML}</p></div>
                </div>
                <div class="ui segments">
                    <div class="ui segment"><h6>Comment:</h6></div>
                    <div class="ui secondary segment"><p>${data.comment}</p></div>
                </div>
            </div>
        `
    }


//calculate time to seconds
    function calculateSeconds() {
        let timeText = gameClock.innerHTML;
        let timeArray = timeText.split(":");
        let secondsCount = (parseInt(timeArray[0])*60) + parseInt(timeArray[1]);
        return secondsCount;
    }
//calculate seconds to time
    function calculateTime(sec) {
        var minutes = Math.floor((sec) / 60); 
        var seconds = sec - (minutes * 60);
  
        if (minutes < 10) {minutes = "0"+ minutes;}
        if (seconds < 10) {seconds = "0"+ seconds;}
        return minutes + ':' + seconds;
    }

//clock stuff

    function gameClockFunction(){
        ++clockCounter
        gameClock.innerText = clockCounter.toString(10).toMinSec()
    }

    String.prototype.toMinSec = function () {
        var totalSeconds = parseInt(this, 10);
        var minutes = Math.floor((totalSeconds) / 60); 
        var seconds = totalSeconds - (minutes * 60);
  
        if (minutes < 10) {minutes = "0"+ minutes;}
        if (seconds < 10) {seconds = "0"+ seconds;}
        return minutes + ':' + seconds;
    }

//modal functionality

    function displayModal(modal) {
        modal.style.display = "block";    
    }

    function hideModal(modal) {
        modal.style.display = "none";
    }
// account deletion
    function confirmDelete() {
        deleteAccountContent.innerHTML = ""
        
        const h3 = document.createElement("h3");
        h3.textContent = `Are you sure you want to delete your Account, ${usernameName}?`
        const h4 = document.createElement("h4");
        h4.textContent = "All your games will be deleted and you will be logged out."
        const btn = document.createElement("button")
        btn.textContent = "Yes, I want to be Deleted Forever"
        btn.addEventListener('click', deleteUser)
        deleteAccountContent.appendChild(h3)
        deleteAccountContent.appendChild(h4)
        deleteAccountContent.appendChild(btn)
        displayModal(deleteAccountModal)
    }


    function deleteUser() {
        fetch(`${USERSURL}/${userID}`, {
            method: 'DELETE',
            headers: { 
                "Access-Control-Allow-Origin": `*`,
                "Content-Type": "application/json", 
                "Accept": "application/json"}
        })
        .then(confirmDeletion)
        .then(setTimeout(function(){deleteAccountModal.style.display = "none"}, 3000))
        .then(setTimeout(handleLogout, 3000)) 
    }


    function confirmDeletion(){
        deleteAccountContent.innerHTML = ""
        const h3 = document.createElement("h3");
        h3.textContent = `Fine, ${usernameName}. Your Account has been deleted and you will be logged out now...`
        deleteAccountContent.appendChild(h3)
        displayModal(deleteAccountModal)
    }

//leaderboard stuff      leaderBoardContent

    function handleLeaderBoard() {
        leaderBoardContent.innerHTML = ""
        
        fetch(`${GAMESURL}`)
        .then(resp => resp.json())
        .then(games => showGames(games))
        .then(showLeaderBoard())
       
    }

    function showGames(games) {
        
        if (games.length == 0) {
            emptyMessage(leaderBoardContent)
        }
        const div = document.createElement('div')
        div.id = `game${game.id}`;
        div.className = "game-card cat";
        const h51 = document.createElement('h4')
        h51.textContent = "User:"
        const h52 = document.createElement('h4')
        h52.textContent = "Total Time: " 
        const h6 = document.createElement('h4')
        h6.textContent = "Comment:"
        div.appendChild(h51)
        div.appendChild(h52)
        div.appendChild(h6)
        leaderBoardContent.appendChild(div)
        games.forEach(game => addGame(game, leaderBoardContent))
        
    }
    
    function addGame(game, node) {
        const div = document.createElement('div')
        div.id = `game${game.id}`;
        div.className = "game-card";
        const h51 = document.createElement('h5')
        h51.innerHTML = `${game.user.username}`
        const h52 = document.createElement('h5')
        h52.innerHTML =`${calculateTime(game.totaltime)}` 
        const h6 = document.createElement('h5')
        h6.innerHTML =`${game.comment}`
        
        div.appendChild(h51)
        div.appendChild(h52)
        div.appendChild(h6)
        if (game.user.username === usernameName) {
            const btn = document.createElement('button')
            btn.className = "delete-game"
            btn.textContent = "Delete My Game"
            btn.addEventListener('click', () => deleteGame(game.id))
            div.appendChild(btn)
        }
    
        node.appendChild(div)

    }

    function showLeaderBoard() {
        displayModal(leaderBoardModal)
    }

    function deleteGame(id) {
        fetch(`${GAMESURL}/${id}`, {
            method: 'DELETE',
            headers: { 
                "Access-Control-Allow-Origin": `*`,
                "Content-Type": "application/json", 
                "Accept": "application/json"}
        })
        .then(() => {
            const deleted = document.querySelector(`#game${id}`)
            const parent = deleted.parentNode
            deleted.parentNode.removeChild(deleted)
            if (!parent.hasChildNodes()){
                emptyMessage(parent)
            }
        })
    }

    function emptyMessage(node) {
        const div = document.createElement("div");
        div.className = "empty-card";
        const h5 = document.createElement("h5")
        h5.textContent = "Oh No!! No Games to Display...Maybe You Should Play Some... "
        div.appendChild(h5)

        node.appendChild(div)
    }


//user games stuff           myGamesContent
    function handleMyGames() {
        myGamesContent.innerHTML = ""
        fetch(`${USERSURL}/${userID}`)
        .then(resp => resp.json())
        .then(games => addMyGames(games))
        .then(showMyGames)
    }

    function addMyGames(games) {
        if (games.length == 0) {
            emptyMessage(myGamesContent)
        }
        const div = document.createElement('div')
        div.id = `game${game.id}`;
        div.className = "game-card cat";
        const h51 = document.createElement('h4')
        h51.textContent = "User:"
        const h52 = document.createElement('h4')
        h52.textContent = "Total Time: " 
        const h6 = document.createElement('h4')
        h6.textContent = "Comment:"
        div.appendChild(h51)
        div.appendChild(h52)
        div.appendChild(h6)
        myGamesContent.appendChild(div)
        games.forEach(game=> addGame(game, myGamesContent))
    }
    
    function showMyGames() {
        displayModal(myGamesModal)
    }

//show Rules 
    function showRules() {
        Swal.fire({
            title: 'RULES!',
            
            html: `<p>Learn how to your Recycling Symbols with this memory card game! </p>
            <br>
            <p>Login with your Username or create a New Username to store your games. </p>
            <p>Click the "Start Game" to start the timer and begin playing!</p>
            <br><p>Match the recycling symbol with it's proper description (there is a freebee too!). When all cards are matched, select "Finished" to end the game. </p>
            <br><p>To Start Over before finishing a game, click the "Restart Game" button. </p>
            <br><p>To save the game (and possibly make it to the leaderboard), enter a comment and hit "Save".</p>
            <p>Have Fun!</p>
            <br>
            <p style="font-size: small">(&remember to check with your local Recycling Center if you have questions!)<p>`   
            ,
            width: 600,
            padding: '2em',
            imageUrl: 'img/background3.jpg',
            imageWidth: 300,
            imageAlt: 'Custom image',
            backdrop: `
              rgba(0,0,123,0.4)
              url("https://media.giphy.com/media/8zD1MUAlPZf8I/giphy.gif")
              left top
              no-repeat
            `
        })

    }

    function showDoMore() {
        Swal.fire({
            title: "Let's Do More",
            
            html: `
            <p style="font-size: small"> - More Recycling <a href="https://www.recycleacrossamerica.org/tips-to-recycle-right"> Tips Here </a></p>
            <p style="font-size: small"><p style="font-size: small">- Know what CAN'T be recycled. </p> <p style="font-size: small"> - Ex: plastic bags, styrofoam, tissue and food related paper.</p> <p style="font-size: small"> - <a href="https://www.buzzfeed.com/tomvellner/heres-how-to-start-composting-in-2018">Compost </a> all food and food-soiled paper when possible. </p>
            <p style="font-size: small">- Many metal items like cans, spray cans, tin foil, can also be recycled. Glass containers as well. </p>
           <p style="font-size: small">- Avoid Single Use Plastic</p>
           <p style="font-size: small">- Invest in and use re-usable bags & water bottles!</p>
           <p style="font-size: small">- Use carpool/public transportation whenever possible.</p>
           <p style="font-size: small">- Eat as <a href="https://www.pcrm.org/news/blog/how-eating-more-plants-can-save-lives-and-planet">Plant-Based</a> as possible.</p>
           <p style="font-size: small">- Put your money where your mouth/home is and invest in sustainable options.</p>
           <p style="font-size: small"> Additional resources: </p>
         
           <p style="font-size: small"> ~<a href="https://en.reset.org/act/12-things-you-can-do-climate-change-0"> Things We Can Do Right Now</a></p>
           
           <p style="font-size: small"> ~<a href="https://unfccc.int/"> Climate Change updates</a></p>
           
           <p style="font-size: small"> ~<a href="https://www.fridaysforfuture.org/"> Fridays for Future</a></p>
           
        
           </p>
            
            `
            ,
            width: 600,
            padding: '2em',
            backdrop: `
              rgba(0,0,123,0.4)
              url('https://media.giphy.com/media/3og0IBq1emkEfTmU9i/giphy.gif')
              left top
              no-repeat
            `
        })

    }
//card functionality
    
    function flipCard() {
        if(!usernameName) {
             
            Swal.fire('Hello! This Game currently works on Google Chrome Browsers. Please Login and Press START to Play!')
            return;
        }
        if(lockBoard){
            return;
        }

        if (this === firstCard) return;

        this.classList.add('flip');

        if (!hasFlippedCard) {
            hasFlippedCard = true;
            firstCard = this;

            return;
        }

        secondCard = this;
        checkForMatch();
    }

    function checkForMatch() {
        let isMatch = firstCard.dataset.framework === secondCard.dataset.framework;

        isMatch ? disableCards() : unflipCards();
    }

    function disableCards() {
        firstCard.removeEventListener('click', flipCard);
        secondCard.removeEventListener('click', flipCard);
        pairs++

        resetBoard();
        if (pairs == 10) {
            toggleDisable(stopButton); //allow stop when all cards are flipped
        }
    }

    function unflipCards() {
        lockBoard = true;

        setTimeout(() => {
            firstCard.classList.remove('flip');
            secondCard.classList.remove('flip');

            resetBoard();
        }, 1000);
    }

    function resetBoard() {
        [hasFlippedCard, lockBoard] = [false, false];
        [firstCard, secondCard] = [null, null];
    }

    function shuffle() {
        cards.forEach(card => {
            card.classList.remove('flip')
            let random = Math.floor(Math.random() * 12);
            card.style.order = random;
            card.addEventListener('click', flipCard);
        });
    };

})
