(function() {
  //Setup
  let search = document.querySelector("input"),
    showHolder = document.querySelector(".show-div"),
    filter = document.querySelector(".filter"),
    theme = "dark", def = {}, current = {}, getlast = () => JSON.parse(localStorage.getItem("last")).name;

  async function loadDef(){
    let data = await fetch("./public/def.json")
      .then((res) => res.json())
      .catch(console.error);
    return data;
  }

  loadDef()
  .then((res) =>{
    def = res;
    if(!localStorage.getItem("last")){
      localStorage.setItem("last",JSON.stringify(def));
      loadCharacters(def,true,false,null);
       current = def;
    }
    else if (getlast() === "Show name" || getlast() === "Error 404"){
       loadCharacters(def,true,false,null);
       current = def;
    }
    else if(getlast() !== "Show name"){
      loadCharacters(getlast(),false,false,null);
      current = JSON.parse(localStorage.getItem("last"));
    }
  })
  .catch(console.error);

  //theme
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    console.log(document.querySelector(".theme").className);
    document.querySelector(".theme").className = document.querySelector(".theme").className.replace("fa-sun","fa-moon");
  }
  document.querySelector(".theme").addEventListener("click",(e)=>{
    let ele = e.target;
    if(localStorage.theme === "dark"){
      localStorage.theme = "light";
      document.documentElement.classList.remove('dark')
    }else{
      localStorage.theme = "dark"
      document.documentElement.classList.add('dark')
    }
    theme = localStorage.theme;
    toggleClass(ele,"fa-sun","fa-moon");
  })

  //Filter
  function filterName(stack,asc){
    var newArr = stack.map((char) => [char.character.name,char]), unique = [...new Map(newArr).values()];
    if(asc === true) unique.sort((a, b) => a.character.name.localeCompare(b.character.name));
    else if(asc === false) unique.sort((a, b) => b.character.name.localeCompare(a.character.name));
    return unique;
  }
  
  filter.addEventListener("click",(e)=>{
    toggleClass(document.querySelector(".filter-icon"),"fa-arrow-down-a-z","fa-arrow-up-a-z")
    //info [filter,asec,desc]
    loadCharacters(current,true,false,document.querySelector(".filter-icon").classList.contains("fa-arrow-down-a-z"));
  })
  document.querySelector(".filter-rest").addEventListener("click",(e)=>{
    loadCharacters(current,true,false,null);
  })
  //Search
  search.addEventListener("keypress",(e)=>{
    if(e.key === "Enter"){
      e.preventDefault();
      loadCharacters(def,false,true,false)
    }
  })
  document.querySelector(".search-rest").addEventListener("click",(e)=>{
    loadCharacters(def,true,false,null);
  })
  document.querySelector(".search-btn").addEventListener("click",(e)=>{

    loadCharacters(def,false,true,false)
  })
  //Rating Calc
  function getRating(ave){
    var filledStars = Math.ceil(Math.round(ave / 2));
    var empyStars = 5 - filledStars;
    let div = document.createElement("div");
    for(var x = 0; x != filledStars; x++){
      div.append(
        Object.assign(
        document.createElement("i"),
        {className:"fa-solid fa-star"}
      ))
    }
    for(var y = 0; y != empyStars; y++){
      div.append(
        Object.assign(
        document.createElement("i"),
        {className:"fa-regular fa-star"}
      ))
    }
    return div;
  }

  //Element Factory
  async function loadCharacters(token, fetch, searched, options){
    let show = document.querySelector("input").value, container = document.querySelector(".character-location");
    container.innerHTML = "";
    let tvShowInfo;
    try{
      tvShowInfo = fetch || (searched && show === "")? token : await getShow(!searched? token : show.toLowerCase());
    }catch(err){
      errorControl();
      return;
    }
    let showChars = filterName(tvShowInfo._embedded.cast, options);
    localStorage.setItem("last",JSON.stringify(tvShowInfo));
    current = tvShowInfo;
    console.log(tvShowInfo.name,tvShowInfo.name !== "Error 404");

    document.querySelector(".show-summary").innerHTML = await tvShowInfo.summary;
    document.querySelector(".show-name-mb").innerHTML = await tvShowInfo.name;
    document.querySelector(".show-name-lp").innerHTML = await tvShowInfo.name;

    let rating = await getRating(tvShowInfo.rating.average);
    let genres = await getGenres(tvShowInfo.genres);
    //await console.log(tvShowInfo.genres)

    showChars.forEach((person)=>{
      container.appendChild(convert(person))
    })

    document.querySelector(".show-div").className.replace("hidden","");
    document.querySelector(".show-rating").innerHTML = rating.innerHTML;
    document.querySelector(".show-banner").src = await tvShowInfo.image.medium;
    document.querySelector(".show-genre").innerHTML = genres.innerHTML;
    document.querySelector(".show-chars").innerHTML = tvShowInfo.name + " Characters:";
  }

  function convert(index){
    let div = document.createElement("div"), secondDiv = document.createElement("div");
    div.className = "rounded-md border-[3px] border-white dark:border-sky-950 shadow-md p-1 w-96";
    secondDiv.className = "border-inherit"
    var img = "";
    try{
      img = index.character.image.medium;
    }
    catch(err){
      console.log(err);
      img = "https://placehold.jp/300x300.png";
    }

    var char = index.character.name, actor = index.person.name;
    div.append( Object.assign(document.createElement("img") , {src : img, className : "mx-auto rounded touch-auto"}))
    secondDiv.append( Object.assign(document.createElement("h2") , { innerText: char, className : "border-b border-inherit "}))
    //secondDiv.append(Object.assign(document.createElement("br")));
    secondDiv.append(Object.assign(document.createElement("p") , {innerText : "Played by: " + actor, className : ""}))
    div.append(secondDiv)
    return div;
  }

  function getGenres(genre){
    let div = document.createElement("div");
    for(let name of genre){
      div.append( Object.assign( document.createElement("label") , {innerText: name, className: "border lap:border-2 rounded-full border-inherit lap:p-0.5 text-center"}) )
    }
    return div;
  }
  //Error Handle
  async function errorControl(){
    await fetch("./public/error.json")
    .then((res) => res.json())
    .then((res) => {
      loadCharacters(res,true,false,false)
    })
    .catch((err) => console.error)
    
  }
  //Misc
  async function getShow(show){
    let characters;
   await fetch(`https://api.tvmaze.com/singlesearch/shows?q=${show}&embed=cast`)
    .then((res) => {if(res.ok) return res.json(); throw new Error("404 Can't find Show!")})
    .then((res) => characters = res)
    return characters;
  }

  function toggleClass(element, class1, class2) {
    if (element.classList.contains(class1)) {
      element.classList.remove(class1);
      element.classList.add(class2);
    } else {
      element.classList.remove(class2);
      element.classList.add(class1);
    }
  }

})();
