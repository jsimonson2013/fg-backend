const sendmail = require('sendmail')()

const makeCode = (length) => {
  let text = ""
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

  for (let i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))

  return text
}

const sendEmail = (recipient, subject, body) => {
	sendmail({
		from: 'webmaster@jacobsimonson.me',
		to: recipient,
		subject: subject,
		html: `Hello,<br><br>${body}<br><br>Have a nice day!<br><br><a href="https://friendgroup.jacobsimonson.me">Link to FriendGroup.</a>`,
	}, (err, reply) => {if (err) console.log(err)})
}

module.exports = {
	changeDefault: (connection, req, res) => {
		connection.query(`update users set default_group_id=${req.query.gid} where user_id=${req.query.uid};`, (err, results) => {
			if (err) throw err

			res.sendStatus(200)
		})
	},
	createGroup: (connection, req, res) => {
		connection.query(`insert into groups (name) values ('${req.query.name}');`, (err, results) => {
			if (err) throw err

			connection.query(`select group_id from groups where name='${req.query.name}';`, (e, rows, fields) => {
				if (e) throw e

				connection.query(`insert into memberships (group_id, user_id) values (${rows[0].group_id}, ${req.query.uid});`, (e, r) => {
					if (e) throw e

					res.json({
						'gid': rows[0].group_id,
						'gname': req.query.name 
					})

				})
			})
		})	
	},
	createProfile: (connection, req, res) => {
		const code = req.query.code

		connection.query(`select email, group_id from invitees where code='${code}'`, (err, rows, fields) => {
			if (rows.length > 0) res.redirect('https://friendgroup.jacobsimonson.me/html/create-profile.html')

			else res.sendStatus(404)
		})
	},
	defaultGroup: (connection, req, res) => {
		connection.query(`select default_group_id from users where user_id=${req.query.uid};`, (err, rows, fields) => {
			if (err) throw err

			res.json({
				'gid': rows[0].default_group_id
			})
		})
	},
	getGroups: (connection, req, res) => {
		connection.query(`select name, groups.group_id from memberships inner join groups on memberships.group_id=groups.group_id where user_id=${req.query.user_id};`, (err, rows, fields) => {
			if (err) throw err

			if (rows.length < 1) {
				res.json({'': ''})
				return
			}

			res.json(rows)
		})
	},
	getProfile: (connection, req, res) => {
		connection.query(`select * from users where user_id='${req.query.user_id}';`, (err, rows, fields) => {
			if (err) throw err

			if(rows.length < 1) return

			res.json(rows)
		})
	},
	getScore: (connection, req, res) => {
		connection.query(`select score from users where firstname='${req.query.first}' and lastname='${req.query.last}';`, (err, rows, fields) => {
			if (err) throw err

			if(!rows.length) res.json({'score': 0})

			else res.json({'score': rows[0].score})
		})
	},
	getVotes: (connection, req, res) => {
		connection.query(`select vote_id from votes where post_id in (select post_id from votes where post_id=${req.query.post_id} and user_id=${req.query.user_id});`, (err, rows, fields) => {
			if (err) throw err

			if(!rows.length) {
				res.json({'': ''})
				return
			}

			res.json(rows)
		})
	},
	incrementScore: (connection, req, res) => {
		connection.query(`update users set score=score + 1 where user_id='${req.query.uid}';`, (err, results) => {
			if (err) throw err

			res.sendStatus(200)
		})
	},
	invite: (connection, req, res) => {
		const email = req.query.email
		const userid = req.query.uid
		const groupid = req.query.gid

		connection.query(`select user_id from users where email='${email}';`, (err, rows, fields) => {
			if (err) throw err

			const joinCode = makeCode(10)

			if (!rows[0]) {
				connection.query(`insert into invitees (email, invite_id, group_id, code) values ('${email}', '${userid}', '${groupid}', '${joinCode}');`, (err, results) => {
					if (err) throw err

					connection.query(`insert into users (email, default_group_id) values ('${email}', '${groupid}');`, (e, r) => {
						if (e) throw e
	
						const extra = `You can complete your account activation and group joining by following this link<br><br><a href="https://fgapi.jacobsimonson.me/create-profile/?code=${joinCode}">friendgroup.jacobsimonson.me<a><br><br>And entering the following code in the Code field:<br><b>${joinCode}</b>`

						handleSendEmail(extra)
					})
				})
			}

			else {
				connection.query(`select group_id from memberships where user_id=${rows[0].user_id};`, (er, rs, fls) => {
					if (er) throw er

					if (!rs[0]) res.sendStatus(404)

					else {
						for (let r of rs) {
							if (r.group_id == groupid) {
								res.sendStatus(404)
								return
							}
						}

						connection.query(`insert into memberships (user_id, group_id) values (${rows[0].user_id}, ${groupid})`, (e, results) => {
							if (e) throw e

							const extra = `You have been automatically added to the group and can manage memberships from your profile.`

							handleSendEmail(extra)
						})
					}
				})
			}
		
			const handleSendEmail = bodyExtra => {
				let groupname = ''
				let invitername = ''

				connection.query(`select name from groups where group_id=${groupid};`, (error, rows, fields) => {
					if (error) throw error

					groupname = rows[0].name
					connection.query(`select firstname, lastname from users where user_id=${userid};`, (error, rows, fields) => {
						if (error) throw error

						invitername = `${rows[0].firstname} ${rows[0].lastname}`
						const body = `You have been invited by ${invitername} to join the group ${groupname} on FriendGroup!<br><br>${bodyExtra}`

						sendEmail(email, 'You\'re Invited to FriendGroup!', body)
						res.sendStatus(200)
					})

				})
			}
		})
	},
	leaveGroup: (connection, req, res) => {
		connection.query(`delete from memberships where user_id=${req.query.uid} and group_id=${req.query.gid};`, (err, results) => {
			if (err) throw err

			res.sendStatus(200)
		})
	},
	resetPass: (connection, req, res) => {
		const email = req.query.email
		const randpass = makeCode(10)

		connection.query(`update users set pass=AES_ENCRYPT('${randpass}', '${process.argv[5]}') where email='${email}';`, (err, results) => {
			if (err) throw err

			if (results.affectedRows < 1) res.sendStatus(404)

			else {
				const body = `Your password has been reset to:<br><b>${randpass}</b><br>You should probably change that to something you will remember.`

				sendEmail(email, 'Your Password was Reset', body)

				res.sendStatus(200)
			}
		})
	},
	updatePass: (connection, req, res) => {
		const userid = req.body.user
		const newpass = req.body.newpass

		connection.query(`update users set pass=AES_ENCRYPT('${newpass}', '${process.argv[5]}') where user_id=${userid};`, (err, result) => {
			if (err) throw err

			connection.query(`select email from users where user_id='${userid}';`, (err, rows, fields) => {
				const body = 'Just sending this email to let you know that you\'ve changed your password!'

				sendEmail(rows[0].email, 'Confirmation of Password Change', body)
			})
		})
	}
}