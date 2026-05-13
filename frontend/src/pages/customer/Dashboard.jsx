import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const STATUS_META = {
    pending:          { label: 'Pending',         cls: 'badge-pending' },
    assigned:         { label: 'Assigned',         cls: 'badge-assigned' },
    picked_up:        { label: 'Picked Up',        cls: 'badge-picked_up' },
    in_transit:       { label: 'In Transit',       cls: 'badge-in_transit' },
    out_for_delivery: { label: 'Out for Delivery', cls: 'badge-out_for_delivery' },
    delivered:        { label: 'Delivered',        cls: 'badge-delivered' },
    failed:           { label: 'Failed',           cls: 'badge-failed' },
    returned:         { label: 'Returned',         cls: 'badge-returned' },
};

export default function CustomerDashboard() {


    return(
        <h2>Sachithra</h2>
    )
}