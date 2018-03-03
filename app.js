const express = require('express')
const app = express()
const mysql = require('mysql')

app.get('/', (req, res) => {

  connection.query("select * from users WHERE user='" + req.query.user + "';", function (err, rows, fields) {
    if (err) throw err

    if(rows.length < 1) {
     res.sendFile('html/login.html', {root: __dirname})
     return
    }

    if (rows[0].pass == req.query.pass) {
      res.sendFile('html/bookclub.html', {root: __dirname})
    }
    else{
      res.sendFile('html/login.html', {root: __dirname})
    }
  })

})

app.get('/users', (req, res) => {

  connection.query("select * from users;", function(err, rows, fields) {
    if (err) throw err

    if(rows.length < 1) {
      return
    }

    res.json(rows)
  })
})


app.get('/submissions', (req, res) => {

  connection.query("select * from posts;", function(err, rows, fields) {
    if (err) throw err

    if(rows.length < 1) {
      return
    }

    res.json(rows)
  })
})

app.listen(3000, () => {
  console.log('App listening on port 3000!')
})

app.post('/submissions', (req, res) => {
  var bodyStr = ''

  req.on("data", chunk => {
    bodyStr += chunk.toString()
  })

  req.on("end", () => {
    var bodyArr = bodyStr.split(',')

    connection.query("insert into posts (title, author, votes) values ('" + bodyArr[1] + "', '" + bodyArr[2] + "', '');", function(err, result) {
      if (err) throw err
    })

  })
})


app.post('/users', (req, res) => {
  var bodyStr = ''
  var voteStr = ''

  req.on("data", chunk => {
    bodyStr += chunk.toString()
  })

  req.on("end", () => {
    var bodyArr = bodyStr.split(',')

    connection.query("select * from posts where id=" + bodyArr[0] + ";", function(err, rows, fields) {
      if (err) throw err

      if(rows.length < 1) {
        return
      }
      if (rows[0].votes.length > 0)
      	voteStr = rows[0].votes + "," + bodyArr[1]
      else
        voteStr = bodyArr[1].toString()
      updateVotes()
    })

    var updateVotes = () => {
      connection.query("update posts set votes='" + voteStr + "' where id=" + bodyArr[0] + ";", function(err, result) {
        if (err) throw err
      })
    }
  })
})

app.put('/user', (req, res) => {
  res.send('Got a PUT request at /user!')
})

app.delete('/user', (req, res) => {
  res.send('Got a DELET request at /user!')
})

