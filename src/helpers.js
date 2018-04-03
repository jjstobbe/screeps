var helpers = {
    findClosestSource: function() {
        return creep.pos.findClosestByPath(FIND_SOURCES);
	},
	spawn: function(spawnName, energyUsed, body, memoryContents) {
	    var creepName = memoryContents.role + Game.time;
	    var spawn = Game.spawns[spawnName];
	    
	    memoryContents.baseRoom = spawn.room.name;
	    memoryContents.baseSpawn = spawnName;
	    var memoryObject = { memory: memoryContents };
	    
	    var result = spawn.spawnCreep(body, creepName, memoryObject);
	    
	    if(result == OK) {
	        if (!spawn.room.memory[memoryContents.role + 'Count']) {
	            spawn.room.memory[memoryContents.role + 'Count'] = 0;
	        }
	        spawn.room.memory[memoryContents.role + 'Count'] ++;
	    }
	    
	    return result;
	},
	generateBody: function(totalEnergy, bodyPartsAvailable) {
        var body = [];
	    var numDivide = bodyPartsAvailable.length;
	    
	    if(bodyPartsAvailable.indexOf(WORK) != -1) {
            numDivide++;
	    } else if(totalEnergy > 200){
	        body.push(WORK);
	        totalEnergy -= 100;
	    }
        
        var numFifties = Math.floor(totalEnergy/50);
        var slice = Math.floor(numFifties / numDivide); // [WORK, WORK], CARRY, MOVE
        
        for(var i = 0;i<bodyPartsAvailable.length;i++) {
            for(var j = 0;j<slice;j++) {
                body.push(bodyPartsAvailable[i]);
            }
        }
	    
	    return body;
	},
	getSourceForCreep: function(creep) {
	    var sources = Game.rooms[creep.memory.baseRoom].find(FIND_SOURCES);
	    var targetSource;
	    
	    for(var source of sources) {
	        if(creep.memory.role == 'harvester' && Memory.sources[source.id] && (Memory.sources[source.id].creepType == 'harvest' || Memory.sources[source.id].creepType == 'any')){
	            return source;
	        } else if(creep.memory.role != 'harvester' && Memory.sources[source.id] && (Memory.sources[source.id].creepType == 'not-harvest' || Memory.sources[source.id].creepType == 'any')){
	            return source;
	        }
	    }
	    
	    return null;
	},
	getClosestContainer: function(creep) {
	    var sources = creep.room.find(FIND_SOURCES);
	    var targetSource;
	    
	    for(var source of sources) {
	        if(Memory.sources[source.id] && (Memory.sources[source.id].creepType == 'harvest' || Memory.sources[source.id].creepType == 'any') && creep.role == 'harvester'){
	            targetSource = source;
	            break;
	        } else if(Memory.sources[source.id] && (Memory.sources[source.id].creepType == 'not-harvest' || Memory.sources[source.id].creepType == 'any') && creep.role != 'harvester'){
	            targetSource = source;
	            break;
	        }
	    }
	    
	    if(!targetSource) {
	        return null;
	    }
	    
        var container = targetSource.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_CONTAINER
        });
        
        return container;
	},
	getContainerIdForSource: function(source) {
	    // Should probably store the id of the container on the source
	    /* return Memory.sources[source.id].containerId; with more error checking */
        var container = source.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_CONTAINER
        });
        
        if(container) {
            return container.id;
        }
        return null;
	}
};

module.exports = helpers;