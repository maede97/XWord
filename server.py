from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'CHANGE_THIS'

socketio = SocketIO(app)

online_users = 0
puzzle_size = 15

board = " " * puzzle_size * puzzle_size
numbers = [0] * puzzle_size * puzzle_size
circles = [0] * puzzle_size * puzzle_size

# Routes
@app.route('/')
def index():
    return render_template("index.html")

@socketio.on('get-online-people')
def handleGetOnlinePeople():
    # send online people to all users
    emit('get-online-people', {'online-users': online_users}, broadcast=True)

@socketio.on('connection')
def handleConnection(_=None):
    global online_users
    online_users+=1
    sendPuzzleSize()
    handleGetOnlinePeople()

@socketio.on('disconnect')
def handleDisconnect(_=None):
    global online_users
    online_users-=1
    handleGetOnlinePeople()

@socketio.on("puzzlesize")
def sendPuzzleSize():
    emit("puzzlesize", {"size":puzzle_size})

@socketio.on("board")
def sendBoard():
    emit("board", {"board": board, "numbers": numbers, "circles": circles})

@socketio.on("update-board")
def updateBoard(data):
    global board
    global numbers
    global circles
    board = data["board"]
    numbers = data["numbers"]
    circles = data["circles"]
    emit("board", {"board": board, "numbers": numbers, "circles": circles}, broadcast=True)

@socketio.on("server-load")
def loadPuzzle():
    global board
    global numbers
    global circles
    board = open("board.txt").read()
    numbers = eval(open("numbers.txt").read())
    circles = eval(open("circles.txt").read())
    emit("board", {"board": board, "numbers": numbers, "circles": circles}, broadcast=True)

@socketio.on("server-store")
def storePuzzle():
    global board
    global numbers
    with open("board.txt", "w") as wr:
        wr.write(board)
    with open("numbers.txt", "w") as wr:
        wr.write(str(numbers))
    with open("circles.txt", "w") as wr:
        wr.write(str(circles))

if __name__ == '__main__':
    socketio.run(app)