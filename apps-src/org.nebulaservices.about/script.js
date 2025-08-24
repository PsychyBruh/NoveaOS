(async () => {
    const build = parent.novea.version.build.split("-")[0];

    document.getElementById("about").innerHTML = `
    <strong>NoveaOS ${parent.novea.version.codename} (${parent.novea.version.channel})</strong><br>
v${parent.novea.version.major}.${parent.novea.version.minor}.${parent.novea.version.patch} (Build: ${build})<br><br>
NoveaOS is licensed under the <a href="https://www.gnu.org/licenses/agpl-3.3.0.html" target="_blank">GNU AGPLv3</a> license<br>
The GitHub repository can be found <a href="https://github.com/nebulaservices/noveaos" target="_blank">here</a>
`;
})();
