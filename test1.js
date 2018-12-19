//checking node js and some required things
function User(fname,lname,age,gender) {
  this.fname = fname;
  this.lname = lname;
  this.age = age;
  this.gender = gender;
}
var user1=new User('babu','pallam',23,'male');
console.log("\n", user1);
User.prototype.emailDomain='@gmail.com';
console.log("\n",user1);

User.prototype.getEmail=function(){
  return this.fname+this.lname+this.emailDomain;
};

console.log("\n",user1.getEmail());
