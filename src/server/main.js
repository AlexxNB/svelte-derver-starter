import server from '@server';

const app = server({
    port: 8080
});

app.use('/api/:name',(req,resp,next)=>{
    resp.send('Hello, '+req.params.name);
})
