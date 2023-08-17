const express=require('express');
const bcrypt=require('bcrypt');
const jwt=require("jsonwebtoken");
const {PrismaClient}=require('@prisma/client');


const prisma=new PrismaClient();
const app=express();
app.use(express.json());
require('dotenv').config();


const verifyTokenMiddleware=(req,res,next)=>{
    const {authorization}=req.headers;

    if(!authorization || !authorization.startsWith('Bearer ')){
        return res.status(401).json({
            status:'error',
            code:'INVALID_TOKEN',
            message:'Invalid access token provided.'
        })
    }

   const token=authorization.split(' ')[1];
    try{
        jwt.verify(token,process.env.JWT_SECRET_KEY,(err,docodedToken)=>{
            if(err){
                return res.status(401).json({
                    status:'error',
                    code:'INVALID_TOKEN',
                    message:'Invalid access token provided.'
                })
            }
        req.docodedToken=docodedToken ;
        next();
        })

    }catch(error){
        if(error)
        console.error(error)
        res.status(403).json({
            status: 'error',
            code: 'INTERNAL_ERROR',
            message: 'An internal server error occurred'})
    }
}


// Creating New user
app.post('/api/register',async (req,res)=>{
try{
    const {
        username,
        email,
        password,
        full_name,
        age,
        gender
    }=req.body;
    
    //all fields check
    if(!username || !email || !password || !full_name || !age){
        return res.status(400).json({
            status:'error',
            code:'INVALID_REQUEST',
            message:'Invalid request. Please provide all required fields:  username, email, password, full_name.'
        })
    }
    //passwordcheck
    const passwordRegex=/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
    if(!password.match(passwordRegex)){
        return res.status(400).json({
            status:'error',
            code:'INVALID_PASSWORD',
            message:'The provided password does not meet the requirements. Password must be at least 8 characters long and contain a mix of uppercase and lowercase letters, numbers, and special characters.'
        })
    }
    //age check
    if(!Number.isInteger(age) || age<=0){
        return res.status(400).json({
            status:'error',
            code:'INVALID_AGE',
            message:'Invalid age value. Age must be a positive integer.'
        })
    }
    //gender required
    if(!gender){
        return res.status(400).json({
            status:'error',
            code:'GENDER_REQUIRED',
            message:'Gender field is required. Please specify the gender (e.g., male, female, non-binary).'
        })
    }
    // Hashing password
    const hashedPassword=await bcrypt.hash(password,10)

    //creating newUser
    const newUser=await prisma.user.create({
        data:{
            username,
            email,
            password :hashedPassword, // storing hashedpassword
            full_name,
            age,
            gender
        },
    })
    res.status(201).json({
        status:"success",
        message:"User successfully registered!",

data:{ user_id:newUser.id,
    username:newUser.username,
    email:newUser.email,
    full_name:newUser.full_name,
    age:newUser.age,
    gender:newUser.gender

}})
}catch(error){
    if(error.code==='P2002'){
        console.log({meta: error.meta})
        const fieldname=error.meta.target;
        console.log({fieldname})
        if(fieldname==='User_username_key'){
            return res.status(400).json({
                status:'error',
                code:'USERNAME_EXISTS',
                message: 'The provided username is already taken. Please choose a different username.',
            })
        }else if(fieldname==='User_email_key'){
            return res.status(400).json({
                status: 'error',
                code: 'EMAIL_EXISTS',
                message: 'The provided email is already registered. Please use a different email address.'
            })
        }
    }
    console.error(error)
    res.status(500).json({

        status: "error",
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error occurred. Please try again later."
    })
}

})

//generating Token using JWT
app.post('/api/token',async (req,res)=>{
    try{
    const {username,password}=req.body;

    const user= await prisma.user.findUnique({
        where:{username}
    })

    if(!username || !password){
        return res.status(401).json({
            status: "error",
            code:'MISSING_FIELDS',
            message: "Missing fields. Please provide both username and password",
    })
}


    if(!user|| !bcrypt.compare(password,user.password)){
        res.status(401).json({
            status: "error",
            code:'INVALID_CREDENTIALS',
            message: "Invalid credentials. The provided username or password is incorrect.",
        })
    }
 
    const token=jwt.sign({userId:user.id,username:user.username},process.env.JWT_SECRET_KEY,
    {expiresIn:'1h'});
        res.status(200).json({
            status: 'success',
            message: 'Access token generated successfully.',
            data:{
                token,
                expiresIn:3600
            }
        })

}catch(error){
    console.error(error);
    res.status(500).json({
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Internal server error occurred. Please try again later.',
    })
}
})
//storing data
app.post('/api/data',verifyTokenMiddleware,async (req,res)=>{

    const {key,value}=req.body;

    console.log('Request Body:', req.body);
    
    if(!key){
        return res.status(400).json({
            status: 'error',
            code: 'INVALID_KEY',
            message: 'The provided key is not valid or missing.',
        })
    }if( !value){
        return res.status(400).json({
            status: 'error',
            code: 'INVALID_VALUE',
            message: 'The provided value is not valid or missing.',
        })
    }
        try{
            await prisma.data.create({
            data:{
                key,
                value,
                userid:req.docodedToken.userId  //user details form middleware
            }
        })
        res.status(201).json({
            status: 'success',
            message: 'Data stored successfully.'

        })}catch(error){
            if(error.code==='P2002'){
                const fieldname= error.meta.target;
                console.log({fieldname});
                if(fieldname.includes('key')){
                    return res.status(400).json({
                        status:'error',
                        code: 'KEY_EXISTS',
                        message: 'The provided key already exists in the database.To update an existing key, use the update API.',
                    });
                }
            }
            console.error(error);
            res.status(500).json({
                status: 'error',
                code: 'INTERNAL_ERROR',
                message: 'An internal server error occurred'
            });
        }
});
//Retrieving data
app.get('/api/data/:key',verifyTokenMiddleware,async (req,res)=>{
    const {key}=req.params;

        try{
            const dataGot =await prisma.data.findFirst({
                where:{
                    key,
                    userid:req.docodedToken.userId
                },
            })


            if(!dataGot){
                return res.status(404).json({
                    status: 'error',
                    code: 'KEY_NOT_FOUND',
                    message: 'The provided key does not exist in the database.',
                })
            }
            res.status(200).json({
                status:'success',
            data:{
                key:dataGot.key,
                value:dataGot.value
            }            })
        }catch(error){
            if(error)
            console.error(error)
            res.status(500).json({
                status: 'error',
                code: 'INTERNAL_ERROR',
                message: 'An internal server error occurred'})
        }
        
})

//Update data
app.put('/api/data/:key',verifyTokenMiddleware,async (req,res)=>{
    const {key}=req.params;
    const {value}=req.body;

        try{
            await prisma.data.update({
                where:{
                    key,
                    userid:req.docodedToken.userId
                },
                data:{
                    value,
                }
            })
            res.status(200).json({
                status:'success',
                message:'Data updated successfully'     
                  })
        }catch(error){
            console.log('errortype=',error.code)
            if (error.code === 'P2025') {
                return res.status(404).json({
                    status: 'error',
                    code: 'KEY_NOT_FOUND',
                    message: 'The provided key does not exist in the database.',
                });
            }
            console.error(error)
            res.status(500).json({
                status: 'error',
                code: 'INTERNAL_ERROR',
                message: 'An internal server error occurred'})
        }
        
})

//Delete data
app.delete('/api/data/:key',verifyTokenMiddleware,async (req,res)=>{
    const {key}=req.params;

    try{
            await prisma.data.delete({
                where:{
                    key,
                    userid:req.docodedToken.userId
                }
            })
            res.status(200).json({
                status: "success",
                message: "Data deleted successfully."
            })
        
    }catch(error){
        console.error(error)
        if (error.code === 'P2025') {
            return res.status(404).json({
                status: 'error',
                code: 'KEY_NOT_FOUND',
                message: 'The provided key does not exist in the database.',
            });
        }
        res.status(500).json({
            status: 'error',
            code: 'INTERNAL_ERROR',
            message: 'An internal server error occurred'})
    }

})
const PORT=process.env.PORT || 3000
 app.listen(PORT,
    ()=>console.log(`SERVER IS RUNNING ON PORT: ${PORT}` ));