const GrpExp=require('../Models/GroupExpenseModel')
const CustGrpExp=require('../Models/CustGrpExpModel');
const activityLog=require('../Models/ActivityLogModel')
module.exports={

recentActivity:async(recActReq)=>{
    let expenseDataList=[];
    const custId=Number(recActReq.custId);
    const groupIds=recActReq.groupIds;
   //let expDtlsRes= await module.exports.getExpenseDtlsFrmDb(groupIds);
   let expDtlsRes= await module.exports.getExpenseDtlsFromDb(groupIds,custId);
   console.log('expDtlsRes:',expDtlsRes)
   
   const loggedInCustTxns=await module.exports.getAllTxnsForCust(custId);
//console.log('loggedInCustTxns',loggedInCustTxns);
   if(expDtlsRes!==null){
    if(expDtlsRes.length>0)
    {
     
      console.log('expense')
      for(let expense of expDtlsRes)
      {
          if(expense.activityType==='paid'){
         const expenseTxn= loggedInCustTxns.filter(
            txn=>
            txn.expenseId===expense.expenseId
        );
      
      const paidAmount=    expenseTxn.filter(txn=>txn.paidByCustId===custId)
           .map(txn => txn.amount)
          .reduce((prev, curr) => prev + curr, 0);
    
          console.log(paidAmount)
      const oweAmount=    expenseTxn.filter(txn=>txn.oweByCustId===custId)
          .map(txn => txn.amount)
          .reduce((prev, curr) => prev + curr, 0);
          
          console.log('paidAmount',paidAmount)
          console.log('oweAmount',oweAmount)
          const actAmount=(paidAmount-oweAmount).toFixed(2);
        
          console.log('act amount',actAmount)
          expense['actAmount']= actAmount;

             console.log("expense:",expense);
        expenseDataList.push(expense);
         }
         else  expenseDataList.push(expense);
        }
        }
    }
   return expenseDataList;

},

getExpenseDtlsFrmDb:(groupIds)=>{
    return new Promise((resolve,reject)=>{
        GrpExp.find({"groupId":{$in:groupIds}}).populate("createdByCustId","custName custEmail").populate("settledWithCustId:","custName custEmail").populate("groupId","groupName").lean().exec((err,recentAct)=>{

            if(err) {
                 const errorRes={
               "code":"E01",
               "desc":"Unable to fetch recent avtivity details"
           }
          return resolve(errorRes);
            }
            else
            return resolve(recentAct);
        })
    })
},

getExpenseDtlsFromDb:(groupIds,custId)=>{
    return new Promise((resolve,reject)=>{
        activityLog.find({'$or':[ { groupId: { '$in': groupIds }},  { '$and': [ { activityType: 'settled' },    { createdByCustId: custId } ] },    { '$and': [ { activityType: 'settled' }, { settledWithCustId: custId } ] } ]}).populate("createdByCustId","custName custEmail").populate("settledWithCustId","custName custEmail").populate("groupId","groupName").lean().exec((err,recentAct)=>{

            if(err) {
                 const errorRes={
               "code":"E01",
               "desc":"Unable to fetch recent avtivity details"
           }
          return resolve(errorRes);
            }
            else
            return resolve(recentAct);
        })
    })
},
getAllTxnsForCust:custId=>{
return new Promise((resolve,reject)=>{
    CustGrpExp.find({$or:[{"paidByCustId":custId},{"oweByCustId":custId}] },(err,res)=>{
        if(err)
        {}
        else{
            return resolve(res);
        }
    })
})
}
}