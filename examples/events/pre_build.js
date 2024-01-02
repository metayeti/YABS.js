console.log('PREBUILD EVENT RUNNING');
setTimeout(function() {
    process.send({ exit: 'ok' }); 
}, 1000);