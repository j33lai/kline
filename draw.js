(function () {
    var c = document.getElementById("kline")
    var ctx = c.getContext("2d");
    fix_dpi(c);
    w = c.getAttribute('width');
    h = c.getAttribute('height');
    ctx.beginPath();
    ctx.moveTo(w*0.9,0);
    ctx.lineTo(w*0.9, h*1);
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.moveTo(w*0.01,0);
    ctx.lineTo(w*0.01, h*1);
    ctx.stroke();

    ctx.closePath();

})()

function fix_dpi(canvas) {
    let dpi = window.devicePixelRatio;
    //get CSS height
    //the + prefix casts it to an integer
    //the slice method gets rid of "px"
    let style_height = +getComputedStyle(canvas).getPropertyValue("height").slice(0, -2);

    //get CSS width
    let style_width = +getComputedStyle(canvas).getPropertyValue("width").slice(0, -2);

    //scale the canvas
    canvas.setAttribute('height', style_height * dpi);
    canvas.setAttribute('width', style_width * dpi);
}