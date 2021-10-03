import server from '@server';

// @server is preconfigured instance of the Derver server
// https://github.com/alexxnb/derver

// Derver configuration parameters
const app = server({
    port: 3000
});


// Add middlewares. See Derver's readme for more info: https://www.npmjs.com/package/derver#using-middlewares
app.use('/hello/:name',(req,resp,next)=>{
    resp.send('Hello, '+req.params.name);
})
