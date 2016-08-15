var dropdownElm = document.getElementById('trump-dropdown');
var textElm = document.getElementById('text');

function render() {
    var count = dropdownElm.value;

    for (var i = 0; i < textElm.children.length; i++) {
        var child = textElm.children[i];
        child.style.display = i < count ? null : 'none';
    }
}

render();
dropdownElm.addEventListener('change', render);
