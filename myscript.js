var hostname = window.location.hostname;
var milisecInDay = (24 * 60 * 60 * 1000);
var month = milisecInDay * 30;

chrome.storage.local.get('CallManagersAssistant', function (result) {
    var CMA = result['CallManagersAssistant'];
    console.log(CMA);
    if ($.isEmptyObject(CMA)) {
        CMA = new Object();
        CMA.BD = new Object();
    } else {
        CMA = JSON.parse(CMA);
    }
    console.log(CMA);

    //Проверка: правильно ли ввден пароль и логин
    if (!!CMA.logAndPassСorrectly || !CMA.logAndPassСorrectly) {
        inputLoginAndPasswordBitch();
        return; //выход
    }

    // Проверка есть ли инфа об этом сайте в памяти и не старше ли она месяца
    var todayTime = (new Date()).getTime();
    if (!$.isEmptyObject(CMA.BD[hostname]) || ((CMA.BD[hostname].ajaxTime + month) > todayTime)) {
        checkNeedBannerOrNot(CMA.BD[hostname]);
        return; //выход
    }

    var bunResp = $.ajax({
        url: "http://bunker-yug.ru/seo_status.php",
        data: "login=" + bunker.login + "&pass=" + bunker.pass + "&d=" + hostname,
        async: false
    }).responseText;
    bunResp = JSON.parse(bunResp);
    console.log(bunResp);

    if (bunResp.result === 'err') {
        console.log('CallManagersAssistant error, server answer - ' + bunResp);
        CMA.BD[hostname] = {
            thereInBunker: false
        };
    } else if (bunResp.code === '001') {
        CMA.BD[hostname] = {
            thereInBunker: false
        };
    } else if (bunResp.result === 'ok' && bunResp.code === '002') {
        CMA.BD[hostname] = {
            thereInBunker: true,
            status: bunResp.status,
            reportingDate: bunResp.date,
            ajaxTime: (new Date()).getTime(),
            notAlertClickTime: 0
        }
    } else {
        CMA.BD[hostname].thereInBunker = false;
    }

    checkNeedBannerOrNot(CMA.BD[hostname]);
    chrome.storage.local.set({
        'CallManagersAssistant': JSON.stringify(CMA)
    });

});



function checkNeedBannerOrNot(hostnameInfo) {
    if (hostnameInfo.thereInBunker) {
        var today = new Date();
        if (!((hostnameInfo.notAlertClickTime + (milisecInDay / 2)) > today.getTime())) {
            showBanner(hostnameInfo);
        }
    }
}

function showBanner(infoFromBunker) {
    $(document).ready(function () {
        addBannerToTopPage(createMessage(infoFromBunker), detectedStatus(infoFromBunker.status));
    });

    $('#mk_close').click(function () { // ловим клик по крестику
        $('#mkmessage').css('display', 'none');
    });

    $('#notAlertToday').click(function () {
        saveAttr_notAlertClickTime();
    });

}


function createMessage(infoFromBunker) {
    var status = detectedStatus(infoFromBunker.status);
    return 'Есть в базе. Статус продвижения - <ins>' + status + '</ins>, отчетная дата - ' + infoFromBunker.reportingDate + '.';
}

function addBannerToTopPage(message, status) {
    var banner = '<div id="mkmessage" style="background-color:';
    if (status === 'продвигается') banner += 'rgb(255, 74, 74)';
    else banner += 'rgb(75, 240, 75)';
    $('body').prepend(
        banner + ' "><span id="mk_close" >X</span><p>' + message + '</p> <p style="margin:0; font-size:15px;"> <label for="notAlertToday"><input type="checkbox" id="notAlertToday">Не оповещать меня сегодня об этом</label></p></div>'
    );
}

function detectedStatus(statusNumber) {
    if (statusNumber === '4') return 'не продвигается';
    return 'продвигается'
}

function saveAttr_notAlertClickTime() {
    var today = new Date();
    chrome.storage.local.get('CallManagersAssistant', function (result) {
        var CMA = result['CallManagersAssistant'];
        CMA = JSON.parse(CMA);
        //console.log(CMA.BD);
        CMA.BD[hostname].notAlertClickTime = today.getTime();
        chrome.storage.local.set({
            'CallManagersAssistant': JSON.stringify(CMA)
        });
    });
}

function inputLoginAndPasswordBitch() {
    $(document).ready(function () {
        var banner = '<div id="mkmessage" style="background-color:';
        banner += 'rgb(255, 74, 74)';
        var message = 'Логин или пароль введены неверно или не введены вообще. Введите их, нажав на иконку с красной телефонной трубкой справа от адресной строки.'
        $('body').prepend(
            banner + ' "><p>' + message + '</p></div>'
        );
    });
}
