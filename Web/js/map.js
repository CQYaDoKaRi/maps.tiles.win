let oReq = null;

$(function () {
	// 設定 - 地図
	let mapURL = "https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png";
	let mapURL_STD = "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png";
	let mapURL_Local = "http://localhost:58998/Data/{z}/{x}/{y}.png";
	// 設定 - 地図 - Local なし
	mapURL = mapURL_STD;
	mapURL_Local = "";

	// 設定 - 座標
	const lat = 35.623317;
	const lng = 139.750912;
	const z = 14;
	const attr = "<div style=\"width:200px;\">JTB 本社<div><img src=\"https://lh5.googleusercontent.com/p/AF1QipPvtOxmI6I5XIWdkJENYehb-bvCIW6w1vAIyUOk=w156-h96-p-k-no\" /></div></div>";

	// 初期化
	oReq = new req("map", "info", mapURL, mapURL_STD, mapURL_Local);
	oReq.map(lat, lng, z, attr);
});

const req = function (iMap, iInfo, mapURL, mapURL_STD, mapURL_Local) {
	this.iMap = iMap;
	this.iInfo = iInfo;
	this.oMap = $("#" + iMap);
	this.oInfo = $("#" + iInfo);
	this.oMapL = null;
	this.oMarker = null;
	this.vLat = null;
	this.vLng = null;

	this.vURL = mapURL;
	this.vURLSTD = mapURL_STD;
	this.vURLLocal = mapURL_Local;

	this.map = function (lat, lng, z, attr) {
		this.vLat = lat;
		this.vLng = lng;

		oReq.Resize();
		this.oMapL = L.map(this.iMap);

		L.tileLayer(this.vURL, {
			attribution: "ベースタイル"
		}).addTo(this.oMapL);

		if (!this.vURLLocal) {
			L.tileLayer(this.vURLLocal, {
				attribution: "ローカルタイル"
			}).addTo(this.oMapL);
		}

		this.oMapL.setView([lat, lng], z);
		this.oMarker = L.marker([lat, lng]).bindPopup(attr).addTo(this.oMapL);

		const that = this;
		this.oMapL.on("click",
			function (e) {
				that.oMapL.removeLayer(that.oMarker);

				//クリック位置
				that.vLat = e.latlng.lat;
				that.vLng = e.latlng.lng;

				const z = that.oMapL.getZoom();
				that.get(that.vLat, that.vLng, z);

				that.oMarker = L.marker([that.vLat, that.vLng]).bindPopup("選択ポイント").addTo(that.oMapL);
			});

		this.oMapL.on("zoomend",
			function (e) {
				const z = that.oMapL.getZoom();
				that.get(that.vLat, that.vLng, z);
			});

		this.get(lat, lng, z);
	};

	this.get = function (lat, lng, z) {
		$.ajax(
			{
				url: "Handler.ashx"
				, type: "POST"
				, dataType: "text"
				, data:
					{ lat: lat, lng: lng, z: z }
			}
		)
			.done((data) => {
				console.log(data);
				try {
					const json = JSON.parse(data);
					console.log(json);

					const href = this.vURLSTD.replace("{x}", json.x).replace("{y}", json.y).replace("{z}", json.z);

					this.oInfo.html("<a href=\"" + href + "\" target=\"_brank\">X[" + json.x + "], Y[" + json.y + "], Z[" + json.z + "]・・・タイル内座標X[" + json.x_px + "px], タイル内座標Y[" + json.y_px + "px]</a>");
				}
				catch (e) {
					console.error(e);
				}
			})
			.fail((data) => {
				console.error(data);
			});
	};

	this.Resize = function () {
		const w = 0;
		const h = 40;

		const _w = $(window).width() - w;
		const _h = $(window).height() - h;

		this.oMap.css("width", _w + "px");
		this.oMap.css("height", _h + "px");
	};
};

$(window).on("onload resize",
	function () {
		if (oReq) {
			oReq.Resize();
		}
	}
);