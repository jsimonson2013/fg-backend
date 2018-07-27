const iso = require('isomorphic-fetch')

const setup = require('./setup.js')

console.log('=============================TESTING STARTED==========================\n\n')

testLogin = new Promise((resolve, reject) => {
	fetch('http://localhost:3000/login/?user=test&pass=pass', {method: 'GET'})
	.then(res => {
		if (res.status === 200) resolve(true)
		else resolve(false)

		reject()
	})
})

testBypass = new Promise((resolve, reject) => {
	fetch('http://localhost:3000/bypass/?user=1', {method: 'GET'})
	.then(res => {
		if (res.status === 200) resolve(true)
		else resolve(false)

		reject()
	})
})

testSignup = new Promise((resolve, reject) => {
	fetch('http://localhost:3000/signup/?code=code123&first=test&last=mcprofile&pass=pass', {method: 'GET'})
	.then(res => {
		if (res.status === 200) resolve(true)
		else resolve(false)

		reject()
	})
})

runtests = () => {
	const tests = []

	tests.push(testBypass)
	tests.push(testLogin)
	tests.push(testSignup)

	Promise.all(tests).then((res) => {
		console.log(res)
		console.log('\n\n=============================TESTING ENDED============================')

		process.exit()
	})

}

setup.setup.then(() => {
	runtests()
})
