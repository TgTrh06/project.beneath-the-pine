function addHabit() {
    const list = document.getElementById("habitList");

    const habit = document.getElementById("habitInput").value;
    
    const listItem = document.createElement("li");
    listItem.textContent = habit;
    list.appendChild(listItem);
}
