# Set up DB
`mysql -uroot -ppassword`
`create database shovel_ready;`
exit
`mysql -uroot -ppassword < db/schema.sql`

# Run server locally
`gem install foreman`
`npm i`
`foreman start`
open browser at `http://localhost:3000`

