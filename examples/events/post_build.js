console.log('POSTBUILD EVENT RUNNING');
setTimeout(function() {
    process.send({ exit: 'ok' }); 
}, 2000);
