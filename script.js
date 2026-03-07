const text = document.querySelector(".text");
const list = document.querySelector(".list")
const add = document.querySelector(".add")

function newmission() {
    if (text.value === ""){
        return;
    }
    const mission = document.createElement("li");
    mission.textContent = text.value;
    list.append(mission);
    text.value = "";
}

add.addEventListener("click",newmission);

text.addEventListener("keyup",function(e){
    if (e.key === "Enter") {
        newmission();
    }
})