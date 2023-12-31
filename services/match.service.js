const db = require('../db');
const axios = require('axios'); // 假设使用 axios 进行 API 调用
//const { io } = require('../index');
//const ioClient = require('socket.io-client');
//const socket = ioClient('http://163.22.17.145:3000');
const { io } = require('socket.io-client');

//const socket = io("http://163.22.17.145:3000",{
//    transports: ["websocket"] ,
//    query : {'userName': '系統訊息', 'chatRoomId': 1, 'eID': 1}
//});

function formatDateTimeForMessage(date) {
    const pad = (number, length = 2) => String(number).padStart(length, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
           `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}





function formatDateTime(date) {
    const pad = (number, length = 2) => String(number).padStart(length, '0');

    let formattedDate = 
        date.getFullYear() + '-' + 
        pad(date.getMonth() + 1) + '-' + 
        pad(date.getDate()) + ' ' + 
        pad(date.getHours()) + ':' + 
        pad(date.getMinutes()) + ':' + 
        pad(date.getSeconds()) + '.' + 
        pad(date.getMilliseconds(), 3);

    return formattedDate;
}

module.exports.getMemberJourney = async (eID) => {
    try {
        const [records] = await db.query("SELECT journey.* FROM journey JOIN event ON event.userMall = journey.userMall OR event.friends LIKE CONCAT('%', journey.userMall, '%') WHERE event.eID = ?", [eID]);
        console.log("select connect");
        return records;
    } catch (error) {
        console.error("Error in getMemberJourney:", error);
        throw error;
    }
}

function convertToDate(dateStr) {
    const dateString = dateStr.toString();
    return new Date(dateString.slice(0, 4), dateString.slice(4, 6) - 1, dateString.slice(6, 8));
}


function addTimeToDate(date, timeStr) {
    let timeString = timeStr.toString();

    // 確保時間字符串是 4 位長度，如果不是則向左填充 0
    timeString = timeString.padStart(4, '0');

    const hours = parseInt(timeString.slice(0, 2), 10);
    const minutes = parseInt(timeString.slice(2, 4), 10);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
}


function formatDateTime(date) {
    return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
}

module.exports.findAvailableTime = async (memberJourney, eID, chatID) => {
    try {
	const formattedSendTime = formatDateTimeForMessage(new Date());

	const [eventDetails] = await db.query("SELECT eventBlockStartTime, eventBlockEndTime, eventTime, timeLengthHours FROM event WHERE eID = ?", [eID]);
        const { eventBlockStartTime, eventBlockEndTime, eventTime, timeLengthHours } = eventDetails[0];

        const availableTimeSlots = [];
        const blockStartDate = convertToDate(eventBlockStartTime);
        const blockEndDate = convertToDate(eventBlockEndTime);

        let current_date = blockStartDate;
        while (current_date <= blockEndDate) {
            const event_start_time = addTimeToDate(current_date, eventTime);
            const event_end_time = new Date(event_start_time.getTime() + timeLengthHours * 60 * 60 * 1000);
            let isAvailable = true;

            for (const journey of memberJourney) {
                const journey_start_time = new Date(journey.journeyStartTime);
                const journey_end_time = new Date(journey.journeyEndTime);

                // 检查行程是否与事件时间冲突
                if ((journey_start_time <= event_start_time && event_start_time < journey_end_time) ||
                    (journey_start_time < event_end_time && event_end_time <= journey_end_time) ||
                    (event_start_time <= journey_start_time && journey_start_time < event_end_time)) {
                    isAvailable = false;
                    break;
                }
            }

            if (isAvailable) {
                const formattedTime = formatDateTime(event_start_time);
                availableTimeSlots.push(formattedTime);
            }

            current_date = new Date(current_date.getFullYear(), current_date.getMonth(), current_date.getDate() + 1);
        }


        if (availableTimeSlots.length === 1) {
            const startTime = availableTimeSlots[0];
            const startYear = parseInt(startTime.substring(0, 4));
            const startMonth = parseInt(startTime.substring(4, 6)) - 1;
            const startDay = parseInt(startTime.substring(6, 8));
            const startHour = parseInt(startTime.substring(8, 10));
            const startMinute = parseInt(startTime.substring(10, 12));

            const startDate = new Date(startYear, startMonth, startDay, startHour, startMinute);
            const endDate = new Date(startDate.getTime() + timeLengthHours * 60 * 60 * 1000);
            const formattedEndTime = formatDateTime(endDate);

            await db.query("UPDATE event SET eventFinalStartTime = ?, eventFinalEndTime = ?, state = ? WHERE eID = ?", [startTime, formattedEndTime, 1, eID]);
            const [updatedEvent] = await db.query("SELECT * FROM event WHERE eID = ?", [eID]);
	console.log("還沒傳");	
//	//console.log("chatID : ",chatRoomId)socket.emit('matchCompleted', { message: '媒合完畢' });
	//io.to(1).emit('matchCompleted', {
        //    "chatRoomId": 1,
        //    "message": "媒合完畢"
        //});
	

//function formatDateTime(date) {
//    const pad = (number, length = 2) => String(number).padStart(length, '0');

//    let formattedDate = 
//        date.getFullYear() + '-' + 
//        pad(date.getMonth() + 1) + '-' + 
//        pad(date.getDate()) + ' ' + 
//        pad(date.getHours()) + ':' + 
//        pad(date.getMinutes()) + ':' + 
//        pad(date.getSeconds()) + '.' + 
//        pad(date.getMilliseconds(), 3);
//
//    return formattedDate;
//}

	const socket = io("http://163.22.17.145:3000",{
    transports: ["websocket"] ,
    query : {'userName': '系統訊息', 'chatRoomId': eID, 'eID': eID}
});

	socket.emit('message',{
		"chatRoomId":eID,
		"userMall":'「揪」easy 官方小精靈',
		"messageContent": '本活動已媒合完畢，且取得一個結果，請前往活動詳細資料確認活動時間',
		"messageSendTime": formattedSendTime,
	});

	console.log("send");
        //

	    return updatedEvent[0];
        } else if (availableTimeSlots.length > 1) {
            const endTime = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
            const formattedEndTime = formatDateTime(endTime);

            await axios.post('http://163.22.17.145:3000/api/vote/insertVote', {
                eID: eID,
                userMall: '系统',
                voteName: 'Event Time Voting',
                endTime: formattedEndTime,
                singleOrMultipleChoice: 0
            });

            const [voteRecords] = await db.query("SELECT vID FROM vote WHERE eID = ? ORDER BY vID DESC LIMIT 1", [eID]);
            if (!voteRecords || voteRecords.length === 0) {
                throw new Error('Failed to get vID from database');
            }
            const vID = voteRecords[0].vID;

	    for (const timeSlot of availableTimeSlots) {
        // &#8203;``【oaicite:0】``&#8203;對於每個可用時間段，計算對應的結束時間
        const startYear = parseInt(timeSlot.substring(0, 4));
        const startMonth = parseInt(timeSlot.substring(4, 6)) - 1;
        const startDay = parseInt(timeSlot.substring(6, 8));
        const startHour = parseInt(timeSlot.substring(8, 10));
        const startMinute = parseInt(timeSlot.substring(10, 12));
        const startDate = new Date(startYear, startMonth, startDay, startHour, startMinute);
        const endDate = new Date(startDate.getTime() + timeLengthHours * 60 * 60 * 1000);
        const formattedEndTime = formatDateTime(endDate);

		  await axios.post('http://163.22.17.145:3000/api/votingOption/insertVotingOption', {
                  vID: vID,
                   votingOptionContent: `${timeSlot} ~ ${formattedEndTime}` // 現在投票選項包含開始時間和結束時間
		 });
            }
            await db.query("UPDATE event SET state = ? WHERE eID = ?", [2, eID]);
	    
	    const [updatedEvent] = await db.query("SELECT * FROM event WHERE eID = ?", [eID]);
//	    io.to(chatRoomId).emit('matchCompleted', { message: '媒合完畢並創建投票' });
	

        //    return { message: 'Vote created', voteID: vID };
       		
	const socket = io("http://163.22.17.145:3000",{
    transports: ["websocket"] ,
    query : {'userName': '系統訊息', 'chatRoomId': eID, 'eID': eID}
});

        socket.emit('message',{
                "chatRoomId":eID,
                "userMall":'「揪」easy 官方小精靈',
                "messageContent": '本活動已媒合完畢，但有多個時間可選擇，所以小精靈我已經幫忙自動創建投票了～請前往投票選擇想要的活動時段喔！',
                "messageSendTime": formattedSendTime,
        });

        console.log("send");
	return updatedEvent[0];

	} else {
            return { message: 'No available time slots found' };
        }
    } catch (error) {
        console.error("Error in findAvailableTime:", error);
        throw error;
    }
};
