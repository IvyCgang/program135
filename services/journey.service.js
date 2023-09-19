const db = require('../db')

module.exports.getAllJourney = async () => {
	const [records] = await db.query("SELECT * FROM journey")
	return records;
}

module.exports.getJourneyById = async (jID) => {
        const [records] = await db.query("SELECT * FROM journey WHERE jID = " + jID)
        return records;
}

module.exports.deleteJourney = async (jID) => {
        const [{affectedRows}] = await db.query("DELETE FROM journey WHERE jID = " + jID)
        return affectedRows;
}

module.exports.addJourney = async (obj) => {
	console.log(obj);
        
		const [{affectedRows}] = await db.query("INSERT INTO journey (uID, journeyName, journeyStartTime, journeyEndTime, isAllDay, location, remindStatus, remindTime, remark, color) VALUES (?,?,?,?,?,?,?,?,?,?)",
		[obj.uID, obj.journeyName, obj.journeyStartTime, obj.journeyEndTime, obj.isAllDay, obj.location, obj.remindStatus, obj.remindTime, obj.remark, obj.color])
        
	//	const response = {
         //  message: '新增成功',
           // affectedRows: affectedRows
        //};

       // return response;
   // } catch (error) {
        // 如果有錯誤，建立 JSON 錯誤回應物件
     //   const errorResponse = {
       //     error: '發生錯誤'
       // };
		return affectedRows;
};
