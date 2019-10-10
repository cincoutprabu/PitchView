//ProjectileHelper.js

function findInitialVelocity(initialPosition, targetPosition, timeOfFlight)
{
    //Find displacement between target and initial positions
    var dx = targetPosition.x - initialPosition.x;
    var dy = targetPosition.y - initialPosition.y;
    var dz = targetPosition.z - initialPosition.z;

    //Compute initial-velocity
    var v_x = dx / timeOfFlight;
    var v_y = (dy / timeOfFlight) - (0.5 * GRAVITY * timeOfFlight);
    var v_z = dz / timeOfFlight;
    return new THREE.Vector3(v_x, v_y, v_z);
}

function findPointOfImpact(initialPosition, velocity, timeOfFlight)
{
    //Find distance travelled in x, y, z directions
    var dx = (velocity.x * timeOfFlight);
    var dy = (0.5 * GRAVITY * timeOfFlight * timeOfFlight) + (velocity.y * timeOfFlight);
    var dz = (velocity.z * timeOfFlight);

    //Compute point-of-impact
    var x = initialPosition.x + dx;
    var y = initialPosition.y + dy;
    var z = initialPosition.z + dz;
    return new THREE.Vector3(x, y, z);
}
