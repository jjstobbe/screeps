var longTerm = {
    makeNumCreepsOkay: function(spawnName) {
        var mainSpawn = Game.spawns[spawnName];
        var roomMemory = Memory.rooms[mainSpawn.room.name];
        
        var harvesterCount = 0;
        var builderCount = 0;
        var upgraderCount = 0;
        var minerCount = 0;
        var janitorCount = 0;
        
        for(var name in Game.creeps) {
            var creep = Game.creeps[name];
            
            if (creep.memory.baseRoom == mainSpawn.room.name) {
                if (creep.memory.role == 'harvester') {
                    harvesterCount ++;
                } else if (creep.memory.role == 'builder') {
                    builderCount ++;
                } else if (creep.memory.role == 'upgrader') {
                    upgraderCount ++;
                } else if (creep.memory.role == 'miner') {
                    minerCount ++;
                } else if (creep.memory.role == 'janitor') {
                    janitorCount ++;
                }
            }
        }
        
        roomMemory.harvesterCount = harvesterCount;
        roomMemory.builderCount = builderCount;
        roomMemory.upgraderCount = upgraderCount;
        roomMemory.minerCount = minerCount;
        roomMemory.janitorCount = janitorCount;
	},
};

module.exports = longTerm;