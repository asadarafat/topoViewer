ssh -t root@138.203.26.59 "sudo -S /sbin/ip netns exec clab-nokia-MAGc-lab-AGG-UPF01 tcpdump -U -nni  eth3" | wireshark -k -i -
ssh -t root@138.203.26.59 "sudo -S /sbin/ip netns exec clab-nokia-MAGc-lab-AGG-UPF01 tcpdump -U -nni  eth4" | wireshark -k -i -


// wireshark
ssh root@138.203.26.59 "sudo -S /sbin/ip netns exec clab-nokia-MAGc-lab-AGG-UPF01 tcpdump -U -nni eth4 -w -" | wireshark -k -i -
// copy
ssh -t root@138.203.26.59 "sudo -S /sbin/ip netns exec clab-nokia-MAGc-lab-AGG-UPF01 tcpdump -U -nni  eth4" | wireshark -k -i -

copy 
ssh root@138.203.26.59 "sudo -S /sbin/ip netns exec - tcpdump -U -nni  eth1" | wireshark -k -i -

ssh root@138.203.26.59 "sudo -S /sbin/ip netns exec - tcpdump -U -nni eth4 -w -" | wireshark -k -i -
