import bcrypt from "bcryptjs";

const password = 'password';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
    console.log(hash);
});